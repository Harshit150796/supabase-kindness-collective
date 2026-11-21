"""The ending's soundtrack: a voiceover in place of music (Kokoro TTS, voice "af_heart", speed 0.9).
Each line is read separately and placed at its cue from cues-main.json ('vo'), so the cuts land on spoken beats.
Treatment: high-pass, a little warmth and presence, gentle compression, a short room. Underneath: only quiet
whooshes on the cuts and taps on the phone screens (no music, nothing tonal).
Usage: python3 voice.py <kokoro_dir> [out.wav]   (kokoro_dir holds kokoro-v1.0.onnx and voices-v1.0.bin)
"""
import os, sys, json, wave
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'work'))
C = json.load(open(os.path.join(HERE, 'cues-main.json')))
os.environ['DUR'] = str(C['dur'])
import numpy as np
from scipy.signal import resample_poly, lfilter, butter, fftconvolve
from inst import SR, N, S, Bus, whoosh, click, rng  # noqa: E402
from kokoro_onnx import Kokoro  # noqa: E402

KD = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'ending-audio.wav')
VOICE, SPEED = 'af_heart', 0.9
k = Kokoro(os.path.join(KD, 'kokoro-v1.0.onnx'), os.path.join(KD, 'voices-v1.0.bin'))

def biquad_peak(x, f0, gain_db, q=0.8, shelf=None):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; cs, sn = np.cos(w), np.sin(w); al = sn / (2 * q)
    if shelf == 'low':
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * cs + sq), 2 * A * ((A - 1) - (A + 1) * cs), A * ((A + 1) - (A - 1) * cs - sq)]
        a = [(A + 1) + (A - 1) * cs + sq, -2 * ((A - 1) + (A + 1) * cs), (A + 1) + (A - 1) * cs - sq]
    else:
        b = [1 + al * A, -2 * cs, 1 - al * A]; a = [1 + al / A, -2 * cs, 1 - al / A]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x)

vo = np.zeros(N)
for c in [c for c in C['cues'] if c['kind'] == 'vo']:
    a, sr = k.create(c['text'], voice=VOICE, speed=SPEED, lang='en-us')
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, idx[0] - 240): idx[-1] + 2400]
    d = len(a) / sr
    assert abs(d - c['d']) < 0.06, (c['text'], d, c['d'])   # the picture was timed to these lengths
    a = resample_poly(a, SR // 1000, sr // 1000)
    i0 = S(c['t']); n = min(len(a), N - i0)
    vo[i0:i0 + n] += a[:n]
    print(f"{c['t']:6.2f}  {d:4.2f}s  {c['text']}")

# treatment: clean low end, warmth, presence, gentle level control
b, a_ = butter(2, 75 / (SR / 2), 'high'); vo = lfilter(b, a_, vo)
vo = biquad_peak(vo, 200, 2.0, shelf='low')
vo = biquad_peak(vo, 3800, 2.0, q=0.9)
vo = biquad_peak(vo, 7500, -2.0, q=1.2)         # soften the sibilance a touch
win = int(0.02 * SR)
rms = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode='same') + 1e-12)
db = 20 * np.log10(rms / (np.max(rms) + 1e-12))
gr = 10 ** (-np.where(db > -18, (db + 18) * (1 - 1 / 3), 0) / 20)
vo *= lfilter([0.004], [1, -0.996], gr)
# a short, warm room (pre-delay 18 ms, decay ~0.3 s), slightly different left and right
ir_n = int(0.9 * SR); ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal((2, ir_n)) * np.exp(-ir_t / 0.13)
ir[:, :int(0.018 * SR)] = 0
b, a_ = butter(2, 5200 / (SR / 2), 'low'); ir = lfilter(b, a_, ir, axis=1)
ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
wet = np.vstack([fftconvolve(vo, ir[0])[:N], fftconvolve(vo, ir[1])[:N]])
mix = np.vstack([vo, vo]) + wet * 0.16

# underneath, very quiet: a whoosh on each cut, a tap on the screens
fx = Bus()
for p in C['plates'][1:]:
    w = whoosh(0.45, 280, 4000, 0.5); fx.add(w, p['t0'] - 0.22)
for c in C['cues']:
    if c['kind'] == 'tap':
        fx.add(click(83, 0.5), c['t'], pan=0.1)
peak_vo = np.max(np.abs(mix))
mix = mix / peak_vo * 0.8 + fx.x * 0.12
mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
t = np.arange(N) / SR
mix *= np.clip((C['dur'] - t) / 0.6, 0, 1)
mix = np.clip(mix, -0.98, 0.98)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print('wrote', OUT)
