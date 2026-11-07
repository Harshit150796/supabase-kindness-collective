"""Voices for the ad dialogue, made offline with the open Kokoro-82M model (Apache-2.0) on onnxruntime.

    python3 -I voice.py --model kokoro-q8.onnx --voices <dir of *.bin> --data <dir> versions/checkout.timeline.js out/voice/checkout

--model   Kokoro-82M v1.0 q8 ONNX (npm package kokoro-q8-shards, the six parts joined; sha256 fbae9257…1478)
--voices  the voice style files from the npm package kokoro-js (voices/*.bin)
--data    config.json (phoneme vocabulary, from the kokoro-onnx wheel) and us_gold.json / us_silver.json
          (pronunciation dictionaries, from the misaki wheel)

Writes one 44.1 kHz WAV per spoken line, plus versions/<name>.voice.js with each line's start, end and a
30 fps mouth-opening envelope that the page uses for lip sync. Only data is read from those packages; the
pronunciation step below is this file's own small lookup over the dictionaries.
"""
import argparse
import json
import os
import re
import wave

import numpy as np
import onnxruntime as ort

SR_MODEL = 24000
SR_OUT = 44100
FPS = 30

# Words the dictionaries lack, or that need a fixed reading.
OVERRIDES = {
    "coupondonation": "kˈupɑn dOnˈAʃən",
    "diapers": "dˈIpəɹz",
    "diaper": "dˈIpəɹ",
    "declined": "dəklˈInd",
    "groceries": "ɡɹˈOsəɹiz",
}
FUNCTION = {"a": "ɐ", "an": "ən", "to": None, "the": None}
VOWEL_START = set("AIOWYaeiouæɑɐɒɔəɛɜɪʊʌᵊ")


def load_lexicon(data):
    lex = {}
    for name in ("us_silver.json", "us_gold.json"):  # gold wins
        with open(os.path.join(data, name), encoding="utf-8") as f:
            for k, v in json.load(f).items():
                if isinstance(v, dict):
                    v = v.get("DEFAULT") or next((x for x in v.values() if x), None)
                if v:
                    lex[k] = v
    return lex


def lookup(lex, w):
    lw = w.lower()
    if lw in OVERRIDES:
        return OVERRIDES[lw]
    for cand in (w, lw, w.capitalize()):
        if cand in lex:
            return lex[cand]
    # contractions the dictionaries lack: everything's, we'll, they're ...
    m = re.match(r"^(.+)'(s|re|ll|ve|m|d)$", lw)
    if m:
        base = lookup(lex, m.group(1))
        if base:
            suf = m.group(2)
            if suf == "s":
                last = base[-1]
                return base + ("ᵻz" if last in "szʃʒʧʤ" else "s" if last in "ptkfθ" else "z")
            return base + {"re": "ɹ", "ll": "l", "ve": "v", "m": "m", "d": "d"}[suf]
    # simple inflections: plural / third person, past tense, -ing
    if lw.endswith("ies") and len(lw) > 4:
        base = lookup(lex, lw[:-3] + "y")
        if base:
            return base + "z"
    if lw.endswith("s") and len(lw) > 3:
        base = lookup(lex, lw[:-1]) or (lookup(lex, lw[:-2]) if lw.endswith("es") else None)
        if base:
            last = base.rstrip("ˈˌ")[-1]
            return base + ("ᵻz" if last in "szʃʒʧʤ" else "s" if last in "ptkfθ" else "z")
    if lw.endswith("ed") and len(lw) > 4:
        base = lookup(lex, lw[:-1]) or lookup(lex, lw[:-2])
        if base:
            last = base[-1]
            return base + ("ᵻd" if last in "td" else "t" if last in "pkfθsʃʧ" else "d")
    if lw.endswith("ing") and len(lw) > 5:
        base = lookup(lex, lw[:-3]) or lookup(lex, lw[:-3] + "e")
        if base:
            return base + "ɪŋ"
    return None


def g2p(lex, text):
    """Text -> Kokoro phoneme string. Raises on unknown words so nothing is mispronounced silently."""
    text = text.replace("...", "…").replace("’", "'").replace("–", "—")
    text = re.sub(r"\bCouponDonation\b", "coupondonation", text)
    toks = re.findall(r"[A-Za-z']+|[.,!?…—;:]", text)
    out = []
    for i, tk in enumerate(toks):
        if re.match(r"[.,!?…—;:]", tk):
            if out:
                out[-1] += tk
            continue
        lw = tk.lower()
        nxt = next((t for t in toks[i + 1:] if re.match(r"[A-Za-z']", t)), None)
        nxt_ph = lookup(lex, nxt) if nxt else None
        starts_vowel = bool(nxt_ph) and nxt_ph.lstrip("ˈˌ")[:1] in VOWEL_START
        if lw == "the":
            ph = "ði" if starts_vowel else "ðə"
        elif lw == "to":
            ph = "tʊ" if starts_vowel else "tə"
        elif lw in FUNCTION:
            ph = FUNCTION[lw]
        else:
            ph = lookup(lex, tk)
        if not ph:
            raise SystemExit(f"no pronunciation for {tk!r} in: {text}")
        out.append(ph)
    return " ".join(out)


def resample(x, n):
    """Band-limited resampling to n samples (FFT)."""
    X = np.fft.rfft(x)
    m = n // 2 + 1
    Y = np.zeros(m, dtype=complex)
    k = min(m, len(X))
    Y[:k] = X[:k]
    return np.fft.irfft(Y, n) * (n / len(x))


def synth(sess, vocab, voices_dir, phonemes, voice, speed, pitch):
    ids = [vocab[c] for c in phonemes if c in vocab][:510]
    pack = np.fromfile(os.path.join(voices_dir, voice + ".bin"), dtype=np.float32).reshape(-1, 1, 256)
    style = pack[min(len(ids), len(pack) - 1)]
    audio = sess.run(None, {
        "input_ids": np.array([[0, *ids, 0]], dtype=np.int64),
        "style": style.astype(np.float32),
        "speed": np.array([speed / pitch], dtype=np.float32),
    })[0][0]
    # pitch > 1 raises pitch and formants (a younger voice); the slower synthesis above keeps the timing
    n_out = int(round(len(audio) / pitch * SR_OUT / SR_MODEL))
    return resample(audio.astype(np.float64), n_out)


def trim(x, thresh=0.01):
    idx = np.where(np.abs(x) > thresh * np.abs(x).max())[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.02 * SR_OUT))
    b = min(len(x), idx[-1] + int(0.06 * SR_OUT))
    return x[a:b]


def envelope(x):
    hop = SR_OUT // FPS
    n = int(np.ceil(len(x) / hop))
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    rms = rms / (np.percentile(rms, 95) + 1e-9)
    rms = np.clip((rms - 0.08) / 0.92, 0, 1)
    sm = np.convolve(rms, [0.25, 0.5, 0.25], mode="same")
    return [round(float(v), 2) for v in sm]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model")
    ap.add_argument("--voices")
    ap.add_argument("--data")
    ap.add_argument("--from-wavs", action="store_true", help="use recorded <id>.wav files already in outdir; only refresh timings and lip sync")
    ap.add_argument("timeline")
    ap.add_argument("outdir")
    a = ap.parse_args()
    txt = open(a.timeline, encoding="utf-8").read()
    tl = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
    if not a.from_wavs:
        vocab = json.load(open(os.path.join(a.data, "config.json"), encoding="utf-8"))["vocab"]
        lex = load_lexicon(a.data)
        sess = ort.InferenceSession(a.model, providers=["CPUExecutionProvider"])
    os.makedirs(a.outdir, exist_ok=True)
    cast = tl["cast"]
    lines = []
    for ln in tl["lines"]:
        who = cast[ln["who"]]
        path = os.path.join(a.outdir, ln["id"] + ".wav")
        if a.from_wavs:
            with wave.open(path) as w:
                x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768
                if w.getnchannels() == 2:
                    x = x.reshape(-1, 2).mean(1)
                if w.getframerate() != SR_OUT:
                    x = resample(x, int(len(x) * SR_OUT / w.getframerate()))
            ph = "(recorded)"
        else:
            ph = g2p(lex, ln.get("say", ln["text"]))
            x = synth(sess, vocab, a.voices, ph, who["voice"], ln.get("speed", who.get("speed", 1.0)), who.get("pitch", 1.0))
            x = trim(x)
            x = x / (np.abs(x).max() + 1e-9) * 0.9 * ln.get("gain", 1.0)
            with wave.open(path, "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(SR_OUT)
                w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
        dur = len(x) / SR_OUT
        lines.append({"id": ln["id"], "who": ln["who"], "t0": ln["t"], "t1": round(ln["t"] + dur, 3), "env": envelope(x)})
        print(f"{ln['id']:>10s} {ln['who']:>9s} {ln['t']:6.2f}-{ln['t'] + dur:6.2f}s  {ph}")
    js = os.path.join(os.path.dirname(a.timeline), tl["name"] + ".voice.js")
    with open(js, "w", encoding="utf-8") as f:
        f.write("// Generated by voice.py: spoken line timings and 30 fps mouth envelopes for lip sync.\n")
        f.write("window.VOICE = " + json.dumps({"fps": FPS, "lines": lines}, separators=(",", ":")) + ";\n")
    print("wrote", js)


if __name__ == "__main__":
    main()
