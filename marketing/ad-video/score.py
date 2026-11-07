"""Synthesised score and sound effects for the video ads (numpy only, nothing to license).

    python3 score.py versions/checkout.timeline.js out/checkout.wav

Reads the version's timeline (duration, sound cues, ambience) and writes a 44.1 kHz stereo WAV.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
RNG = np.random.default_rng(2026)


def load_tl(path):
    txt = open(path, encoding="utf-8").read()
    return json.loads(txt[txt.index("{"): txt.rindex("}") + 1])


class Mix:
    def __init__(self, dur):
        self.dur = dur
        self.n = int(dur * SR)
        self.music = np.zeros((self.n, 2))
        self.fx = np.zeros((self.n, 2))
        self.amb = np.zeros((self.n, 2))

    def add(self, bus, t0, sig, pan=0.0, gain=1.0):
        i0 = int(t0 * SR)
        if i0 >= self.n or len(sig) == 0:
            return
        if i0 < 0:
            sig = sig[-i0:]
            i0 = 0
        sig = sig[: self.n - i0] * gain
        if sig.ndim == 1:
            l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
            sig = np.stack([sig * l, sig * r], 1)
        getattr(self, bus)[i0: i0 + len(sig)] += sig


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, k):
    """Cheap smoothing filter (moving average of length k)."""
    if k <= 1:
        return x
    c = np.cumsum(np.concatenate([np.zeros(k), x]))
    return (c[k:] - c[:-k]) / k


# ---------------------------------------------------------------- instruments
def piano(dur, m, vel=0.6, bright=1.0):
    f = hz(m)
    t = tt(dur)
    s = np.zeros_like(t)
    for k in range(1, 11):
        fk = k * f * np.sqrt(1 + 0.00032 * k * k)
        if fk > 14000:
            break
        amp = (1 / k ** 1.2) * (bright if k > 2 else 1)
        dec = 0.75 + 0.55 * k + f / 900
        s += amp * np.sin(2 * np.pi * fk * t + 0.37 * k) * np.exp(-t * dec)
    s *= 0.7 * np.exp(-t * (1.2 + f / 1400)) + 0.3 * np.exp(-t * 0.35)
    s *= np.clip(t / 0.004, 0, 1)
    ham = lowpass(RNG.standard_normal(int(0.012 * SR)), 6) * np.exp(-np.arange(int(0.012 * SR)) / (0.003 * SR))
    s[: len(ham)] += ham * 0.08
    rel = np.clip((dur - t) / 0.12, 0, 1)
    return s * rel * vel * 0.2


def pad(dur, notes, vel=0.5, attack=1.0, release=1.2, bright=0.5):
    t = tt(dur)
    s = np.zeros_like(t)
    vib = 1 + 0.0016 * np.sin(2 * np.pi * 4.6 * t)
    for m in notes:
        for det, ph in ((-0.0024, 0.3), (0.0, 1.1), (0.0027, 2.0)):
            f = hz(m) * (1 + det)
            for k in range(1, 7):
                s += (1 / k ** (2.2 - bright)) * np.sin(2 * np.pi * f * k * t * vib + ph * k)
    env = np.clip(t / attack, 0, 1) * np.clip((dur - t) / release, 0, 1)
    return s * env * vel * 0.012


def bell(dur, m, vel=0.5):
    f = hz(m)
    t = tt(dur)
    s = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1, 1.6), (2.0, 0.5, 2.4), (2.76, 0.35, 3.0), (5.4, 0.2, 5.0), (8.9, 0.08, 7.0)):
        s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return s * np.clip(t / 0.002, 0, 1) * vel * 0.16


def beep(dur, f, vel=0.3):
    t = tt(dur)
    return np.sin(2 * np.pi * f * t) * np.clip(t / 0.004, 0, 1) * np.clip((dur - t) / 0.01, 0, 1) * vel


def buzz(dur, f, vel=0.3):
    t = tt(dur)
    s = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 3, 5, 7))
    return s * np.clip(t / 0.006, 0, 1) * np.clip((dur - t) / 0.03, 0, 1) * vel


def noise(dur, smooth=1, hp=False):
    x = RNG.standard_normal(int(dur * SR))
    x = lowpass(x, smooth)
    if hp:
        x = np.diff(x, prepend=0)
    return x


def thump(vel=0.5):
    t = tt(0.32)
    return np.sin(2 * np.pi * (52 + 38 * np.exp(-t * 26)) * t) * np.exp(-t * 13) * vel


# ---------------------------------------------------------------- effects
def sfx(mx, t0, kind):
    if kind == "tick":
        mx.add("fx", t0, beep(0.05, 1650, 0.12), pan=0.25)
    elif kind == "decline":
        mx.add("fx", t0, buzz(0.17, 233, 0.16), pan=0.2)
        mx.add("fx", t0 + 0.2, buzz(0.36, 185, 0.16), pan=0.2)
    elif kind == "approve":
        mx.add("fx", t0, beep(0.09, 1320, 0.16), pan=0.25)
        mx.add("fx", t0 + 0.1, beep(0.16, 1760, 0.16), pan=0.25)
        for i, m in enumerate((84, 88, 91)):
            mx.add("fx", t0 + 0.12 + i * 0.07, bell(1.6, m, 0.5), pan=0.1 * i)
    elif kind == "slide":
        d = 0.32
        x = noise(d, 3, hp=True) * np.sin(np.pi * np.arange(int(d * SR)) / (d * SR)) ** 2
        mx.add("fx", t0, x * 0.05, pan=0.3)
    elif kind == "place":
        mx.add("fx", t0, thump(0.25), pan=-0.2)
        mx.add("fx", t0, noise(0.05, 4) * np.exp(-np.arange(int(0.05 * SR)) / 300) * 0.08, pan=-0.2)
    elif kind == "whoosh":
        d = 0.55
        n = int(d * SR)
        env = np.sin(np.pi * np.arange(n) / n) ** 3
        x = noise(d, 9, hp=False) * env
        mx.add("fx", t0 - 0.28, x * 0.09)
    elif kind == "tap":
        mx.add("fx", t0, noise(0.006, 1, hp=True) * 0.12)
        mx.add("fx", t0, beep(0.025, 2300, 0.035))
    elif kind == "success":
        for i, m in enumerate((79, 84)):
            mx.add("fx", t0 + i * 0.09, bell(1.4, m, 0.45))
    elif kind in ("sparkle", "cheer"):
        for i, m in enumerate((88, 91, 95, 100)):
            mx.add("fx", t0 + i * 0.075, bell(1.2, m, 0.22), pan=-0.4 + 0.25 * i)
    elif kind == "scribble":
        d = 0.42
        n = int(d * SR)
        mod = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * np.arange(n) / SR))
        x = noise(d, 2, hp=True) * mod * np.sin(np.pi * np.arange(n) / n)
        mx.add("fx", t0, x * 0.07, pan=0.2)
    elif kind == "zip":
        d = 0.45
        n = int(d * SR)
        mod = 0.5 + 0.5 * np.sin(2 * np.pi * (60 + 80 * np.arange(n) / n) * np.arange(n) / SR)
        mx.add("fx", t0, noise(d, 2, hp=True) * mod * 0.05, pan=-0.2)
    elif kind == "check":
        mx.add("fx", t0, bell(0.9, 91, 0.3), pan=0.2)
    elif kind == "pencil":
        mx.add("fx", t0, beep(0.02, 3200, 0.04))
        mx.add("fx", t0, thump(0.06))


def ambience(mx, kind, t0, t1):
    d = t1 - t0
    n = int(d * SR)
    if n <= 0:
        return
    env = np.clip(np.arange(n) / (0.3 * SR), 0, 1) * np.clip((n - np.arange(n)) / (0.3 * SR), 0, 1)
    if kind == "store":
        bed = lowpass(noise(d), 40) * 0.6
        murmur = lowpass(noise(d), 12) * lowpass(np.abs(noise(d)), 9000) * 1.2
        mx.add("amb", t0, (bed + murmur) * env * 0.05)
        r = np.random.default_rng(int(t0 * 10) + 3)
        t = t0 + 0.9
        while t < t1 - 0.3:
            mx.add("amb", t, beep(0.07, 2480 + r.uniform(-120, 120), 0.012), pan=r.uniform(-0.8, 0.8))
            t += r.uniform(1.1, 2.4)
    elif kind in ("home", "night"):
        mx.add("amb", t0, lowpass(noise(d), 60) * env * (0.025 if kind == "home" else 0.02))
    elif kind == "street":
        mx.add("amb", t0, lowpass(noise(d), 30) * env * 0.03)
        r = np.random.default_rng(8)
        t = t0 + 0.2
        while t < t1 - 0.3:
            for j in range(r.integers(2, 5)):
                dd = 0.07
                tt_ = tt(dd)
                f0 = r.uniform(3200, 4600)
                ch = np.sin(2 * np.pi * (f0 + 1600 * np.sin(np.pi * tt_ / dd)) * tt_) * np.sin(np.pi * tt_ / dd) ** 2
                mx.add("amb", t + j * 0.09, ch * 0.03, pan=r.uniform(-0.7, 0.7))
            t += r.uniform(0.6, 1.4)
    elif kind == "clock":
        t = t0
        i = 0
        while t < t1:
            mx.add("amb", t, beep(0.012, 2600 if i % 2 == 0 else 2100, 0.05) + 0, pan=0.5)
            t += 1.0
            i += 1


def heartbeat(mx, t0, t1, every):
    t = t0
    while t < t1:
        g = 0.35 + 0.65 * min(1, (t - t0) / max(1e-6, (t1 - t0) * 0.6))
        mx.add("fx", t, thump(0.28 * g))
        mx.add("fx", t + 0.24, thump(0.17 * g))
        t += every


# ---------------------------------------------------------------- music helpers
CH = {
    "Am": [57, 60, 64], "F": [53, 57, 60], "C": [48, 52, 55], "G": [55, 59, 62], "Dm": [50, 53, 57],
    "Bb": [46, 50, 53], "Em": [52, 55, 59], "E": [52, 56, 59], "Fmaj7": [53, 57, 60, 64], "Csus": [48, 53, 55],
}


def play_chords(mx, prog, vel=0.5, arp=0.375, top=1, bright=1.0, pad_vel=0.0, pad_bright=0.5, arp_vel=0.55):
    """prog: list of (t0, t1, chord). Bass on the downbeat, broken chord above, optional pad."""
    for t0, t1, name in prog:
        notes = CH[name]
        mx.add("music", t0, piano(min(4.0, t1 - t0 + 1.5), notes[0] - 12, vel * 0.9), pan=-0.2)
        pattern = [notes[0], notes[1], notes[2], notes[1] + 12 * top, notes[2], notes[1]]
        t = t0 + arp
        i = 0
        while t < t1 - 0.05 and arp > 0:
            m = pattern[i % len(pattern)] + 12
            mx.add("music", t, piano(1.8, m, vel * arp_vel, bright), pan=0.15 + 0.05 * (i % 3))
            t += arp
            i += 1
        if pad_vel:
            mx.add("music", t0 - 0.2, pad(t1 - t0 + 1.4, [n + 12 for n in notes], pad_vel, 0.8, 1.0, pad_bright))


def melody(mx, notes, vel=0.5, inst="piano"):
    for t0, m, v in notes:
        if inst == "piano":
            mx.add("music", t0, piano(2.6, m, vel * v / 0.5, 1.1), pan=0.1)
        else:
            mx.add("music", t0, bell(2.2, m, vel * v / 0.5), pan=0.1)


# ---------------------------------------------------------------- compositions
def music_checkout(mx):
    sad = [(1.2, 3.45, "Am"), (3.45, 5.7, "F"), (5.7, 7.95, "C"), (7.95, 10.2, "G"), (10.2, 12.45, "Am"), (12.45, 15.6, "F")]
    play_chords(mx, sad, vel=0.42, arp=0.5625, pad_vel=0.25)
    melody(mx, [(1.2, 76, 0.45), (2.32, 74, 0.32), (3.45, 72, 0.42), (4.57, 69, 0.3), (5.7, 72, 0.42), (6.82, 76, 0.34),
                (7.95, 74, 0.45), (9.07, 71, 0.3), (10.2, 69, 0.45), (11.32, 72, 0.32), (12.45, 69, 0.42), (13.6, 65, 0.36)], vel=0.5)
    hope = [(15.6, 17.25, "C"), (17.25, 18.9, "G"), (18.9, 20.55, "Am"), (20.55, 22.9, "F"), (22.9, 24.75, "C"), (24.75, 26.6, "G")]
    play_chords(mx, hope, vel=0.48, arp=0.275, pad_vel=0.45, pad_bright=0.9, bright=1.2)
    melody(mx, [(15.6, 76, 0.4), (17.25, 79, 0.4), (18.9, 81, 0.42), (20.0, 79, 0.32), (20.55, 77, 0.42), (21.7, 76, 0.34),
                (22.9, 84, 0.55), (23.8, 83, 0.38), (24.75, 79, 0.45), (25.7, 81, 0.38)], vel=0.55)
    play_chords(mx, [(26.6, 28.0, "F"), (28.0, 30.0, "C")], vel=0.5, arp=0.0, pad_vel=0.5, pad_bright=0.9)
    melody(mx, [(26.6, 81, 0.4), (28.0, 84, 0.5)], vel=0.5, inst="bell")


def music_list(mx):
    night = [(0.4, 2.3, "Dm"), (2.3, 4.2, "Bb"), (4.2, 6.1, "F"), (6.1, 7.6, "C")]
    play_chords(mx, night, vel=0.4, arp=0.475, pad_vel=0.22)
    melody(mx, [(0.4, 74, 0.4), (1.35, 72, 0.3), (2.3, 70, 0.42), (3.25, 69, 0.3), (4.2, 69, 0.4), (5.15, 65, 0.3), (6.1, 67, 0.42)], vel=0.48)
    hope = [(7.6, 8.9, "F"), (8.9, 10.2, "C"), (10.2, 11.5, "Dm"), (11.5, 12.8, "Bb")]
    play_chords(mx, hope, vel=0.46, arp=0.325, pad_vel=0.42, pad_bright=0.9, bright=1.15)
    morning = [(12.8, 14.1, "F"), (14.1, 15.4, "C"), (15.4, 16.6, "Bb")]
    play_chords(mx, morning, vel=0.5, arp=0.217, pad_vel=0.45, pad_bright=1.0, bright=1.25)
    melody(mx, [(7.6, 77, 0.4), (8.9, 79, 0.4), (10.2, 81, 0.42), (11.5, 82, 0.4), (12.8, 84, 0.5), (14.1, 84, 0.4), (15.4, 82, 0.42)], vel=0.52)
    play_chords(mx, [(16.6, 18.0, "Bb"), (18.0, 20.0, "F")], vel=0.48, arp=0.0, pad_vel=0.5, pad_bright=0.9)
    melody(mx, [(16.6, 82, 0.4), (18.0, 81, 0.5)], vel=0.5, inst="bell")


def music_pencil(mx):
    box = [(0.3, 81, 0.4), (0.9, 84, 0.3), (1.5, 88, 0.36), (2.1, 84, 0.28), (2.7, 83, 0.36), (3.3, 79, 0.28), (3.9, 81, 0.38), (4.5, 76, 0.3), (5.1, 77, 0.34)]
    melody(mx, box, vel=0.4, inst="bell")
    mx.add("music", 0.2, pad(5.7, [57, 64], 0.25, 1.0, 1.2, 0.3))
    hope = [(5.7, 6.75, "F"), (6.75, 7.8, "C"), (7.8, 8.9, "G"), (8.9, 10.0, "Am")]
    play_chords(mx, hope, vel=0.46, arp=0.2625, pad_vel=0.42, pad_bright=0.9, bright=1.2)
    morning = [(10.0, 11.3, "C"), (11.3, 12.6, "G")]
    play_chords(mx, morning, vel=0.52, arp=0.1625, pad_vel=0.45, pad_bright=1.0, bright=1.3)
    melody(mx, [(10.0, 79, 0.45), (10.65, 84, 0.4), (11.3, 83, 0.42), (11.95, 86, 0.4)], vel=0.5)
    play_chords(mx, [(12.6, 13.6, "F"), (13.6, 15.0, "C")], vel=0.5, arp=0.0, pad_vel=0.5, pad_bright=0.9)
    melody(mx, [(12.6, 81, 0.4), (13.6, 84, 0.5)], vel=0.5, inst="bell")


def music_bumper(mx):
    mx.add("music", 0.05, piano(3.8, 45, 0.45))
    mx.add("music", 0.05, piano(3.8, 57, 0.3))
    mx.add("music", 0.05, pad(3.9, [57, 60, 64], 0.3, 0.5, 0.8, 0.4))
    melody(mx, [(0.6, 76, 0.3), (1.9, 74, 0.3), (2.6, 72, 0.32)], vel=0.45)
    play_chords(mx, [(3.9, 6.0, "C")], vel=0.5, arp=0.0, pad_vel=0.5, pad_bright=1.0)
    melody(mx, [(3.9, 84, 0.45), (4.1, 88, 0.35), (4.3, 91, 0.3)], vel=0.5, inst="bell")


MUSIC = {"checkout": music_checkout, "list": music_list, "pencil": music_pencil, "bumper": music_bumper}


def reverb(x, secs=2.4, wet=0.25):
    n = int(secs * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = lowpass(np.random.default_rng(40 + ch).standard_normal(n), 5) * np.exp(-t / (secs / 5.5)) * (1 - np.exp(-t / 0.012))
        ir /= np.sqrt(np.sum(ir ** 2))
        size = 1 << int(np.ceil(np.log2(len(x) + n)))
        y = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir, size), size)[: len(x)]
        out[:, ch] = x[:, ch] + wet * y
    return out


def main():
    tl = load_tl(sys.argv[1])
    out = sys.argv[2]
    mx = Mix(tl["duration"])
    for kind, a, b in tl.get("ambience", []):
        ambience(mx, kind, a, b)
    for t0, kind in tl.get("sfx", []):
        sfx(mx, t0, kind)
    if tl.get("heart"):
        heartbeat(mx, *tl["heart"])
    MUSIC[tl["music"]](mx)
    music = reverb(mx.music, 2.6, 0.32)
    fx = reverb(mx.fx, 1.2, 0.12)
    mix = music * 0.9 + fx + mx.amb
    t = np.arange(mx.n) / SR
    fade = np.clip((tl["duration"] - t) / 0.8, 0, 1) * np.clip(t / 0.02, 0, 1)
    mix *= fade[:, None]
    mix = np.tanh(mix * 1.6) / np.tanh(1.6)
    mix *= 0.89 / max(1e-9, np.abs(mix).max())
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype("<i2").tobytes())
    print("wrote", out)


if __name__ == "__main__":
    main()
