"""Writes soundtrack.wav (30 s, 44.1 kHz stereo) timed to ad.html. Everything is synthesised here, so there is nothing to license."""
import sys, wave
import numpy as np
SR, DUR = 44100, 30.0
N = int(SR * DUR)
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
hz = lambda n: 440 * 2 ** ((n - 69) / 12)  # MIDI note -> Hz

def env(t0, t1, a=0.8, r=1.2):
    e = np.clip((t - t0) / a, 0, 1) * np.clip((t1 - t) / r, 0, 1)
    return e * (t >= t0) * (t <= t1)

def pad(notes, t0, t1, g=0.05, a=1.0, r=1.4):
    e = env(t0, t1, a, r)
    for i, n in enumerate(notes):
        f = hz(n)
        for k, d in ((1, 0), (1.003, .4), (0.997, .9)):  # slight detune for warmth
            w = np.sin(2 * np.pi * f * k * t + d) + .25 * np.sin(4 * np.pi * f * k * t + d)
            L[:] += w * e * g * (0.8 if i % 2 else 1); R[:] += w * e * g * (1 if i % 2 else 0.8)

def pluck(n, t0, g=0.18, decay=1.6, pan=0.5):
    m = t >= t0; tt = t[m] - t0; f = hz(n)
    w = (np.sin(2*np.pi*f*tt) + .4*np.sin(4*np.pi*f*tt)*np.exp(-tt*3) + .15*np.sin(6*np.pi*f*tt)*np.exp(-tt*5)) * np.exp(-tt * decay) * np.clip(tt / .004, 0, 1)
    L[m] += w * g * (1 - pan) * 2; R[m] += w * g * pan * 2

def noise(t0, dur, g, hp=True):
    m = (t >= t0) & (t < t0 + dur); n = rng.standard_normal(m.sum())
    if hp: n = np.diff(n, prepend=0)
    n *= np.exp(-(t[m] - t0) / (dur / 3)) * g
    L[m] += n; R[m] += n

def thump(t0, g=.35):
    m = (t >= t0) & (t < t0 + .35); tt = t[m] - t0
    w = np.sin(2*np.pi*(55 + 40*np.exp(-tt*25))*tt) * np.exp(-tt*12) * g
    L[m] += w; R[m] += w

def buzz(t0, f, dur, g=.12):
    m = (t >= t0) & (t < t0 + dur); tt = t[m] - t0
    w = np.sign(np.sin(2*np.pi*f*tt)) * .6 + np.sin(2*np.pi*f*tt) * .4
    w *= np.clip(tt/.01, 0, 1) * np.clip((dur-tt)/.03, 0, 1) * g
    L[m] += w; R[m] += w

# Scene 1-2: register and tension (A minor)
pad([45, 52, 60], 0.0, 12.4, g=.035, a=1.5, r=1.0)
for pt in [0.6, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0]:
    for k in range(5): noise(pt + k*.035, .02, .08)   # receipt printer chatter
buzz(4.6, 196, .16); buzz(4.82, 165, .32)            # declined
thump(4.6, .45)
for st in [7.4, 8.6, 9.6, 10.6]: noise(st, .3, .035, hp=False); pluck(64 - (st > 10) * 2, st, .06, 3)
for hb in np.arange(6.8, 12.0, .95): thump(hb, .22); thump(hb + .22, .14)  # heartbeat
# Scene 3: it's real (F major, held breath)
pad([41, 48, 57, 60], 12.4, 16.6, g=.04, a=.8, r=1.2)
pluck(72, 12.7, .09, 1.2, .4); pluck(69, 14.6, .09, 1.2, .6)
# Scene 4-6: the turn (C - G - Am - F - C)
for (ns, a0, a1) in [([48, 55, 64], 16.4, 19.6), ([43, 55, 62, 71], 19.2, 21.8), ([45, 57, 64, 72], 21.4, 24.0), ([41, 57, 65, 69], 23.6, 27.8), ([36, 48, 55, 64, 67, 72], 27.4, 30.0)]:
    pad(ns, a0, a1, g=.04, a=.6, r=.9)
pluck(76, 18.0, .14, 2, .45); pluck(72, 19.0, .12, 2, .55); pluck(79, 19.3, .1, 2, .5)
for i, ut in enumerate([23.8, 24.2, 24.6, 25.0]): pluck([72, 76, 79, 84][i], ut, .13, 1.8, .3 + i*.13)
for n in [72, 76, 79, 84]: pluck(n, 25.35, .07, 1.2)
for i, n in enumerate([60, 64, 67, 72, 76]): pluck(n, 27.6 + i*.09, .1, .9, .5)
# Master: gentle fade-out, normalise
fade = np.clip((DUR - t) / 1.2, 0, 1)
st = np.stack([L, R], 1) * fade[:, None]
st = np.tanh(st * 1.4) / np.tanh(1.4)
st *= 0.89 / np.abs(st).max()
out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('wrote', out)
