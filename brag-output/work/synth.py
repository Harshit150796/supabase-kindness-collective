"""Playful instrument + cartoon SFX library (numpy) for the comic films.

Everything is synthesized and tunable so effects can sit in the song's key.
"""
import numpy as np
from scipy.signal import butter, sosfilt, lfilter, fftconvolve

SR = 48000
rng = np.random.default_rng(11)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45) / (SR / 2), 'low', output='sos'), x, axis=-1)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), 'high', output='sos'), x, axis=-1)


def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1 / (SR / 2), min(f2, SR * 0.45) / (SR / 2)], 'band', output='sos'), x, axis=-1)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.05, hold=None):
    t = np.arange(n) / SR
    hold = (n / SR - r) if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-5), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-5)))
    rel = np.clip((t - hold) / max(r, 1e-5), 0, 1)
    return e * (1 - rel)


class Bus:
    def __init__(self, n):
        self.x = np.zeros((2, n))
        self.n = n

    def add(self, sig, t0, gain=1.0, pan=0.0):
        i0 = int(round(t0 * SR))
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig * l, sig * r]) * np.sqrt(2)
        if i0 < 0:
            sig, i0 = sig[:, -i0:], 0
        m = min(sig.shape[1], self.n - i0)
        if m > 0:
            self.x[:, i0:i0 + m] += sig[:, :m] * gain


# ------------------------------------------------------------------ tonal instruments
def karplus(f, dur, bright=0.5, decay=0.996, pluck_pos=0.18):
    """Karplus-Strong plucked string."""
    n = int(dur * SR)
    L = max(2, int(round(SR / f)))
    buf = rng.uniform(-1, 1, L)
    buf = lp(buf, 1500 + 6000 * bright)
    # pluck position comb
    p = max(1, int(L * pluck_pos))
    buf = buf - np.roll(buf, p) * 0.5
    out = np.zeros(n)
    y = buf.copy()
    idx = 0
    prev = 0.0
    for i in range(n):
        v = y[idx]
        nv = decay * 0.5 * (v + prev)
        prev = v
        y[idx] = nv
        out[i] = v
        idx = (idx + 1) % L
    return out


def ks_fast(f, dur, bright=0.5, decay_s=1.2):
    """Vectorised plucked-string approximation (additive with per-partial damping)."""
    t = tt(dur)
    y = np.zeros_like(t)
    for h in range(1, 14):
        fh = f * h
        if fh > 14000:
            break
        amp = (1.0 / h) * (bright ** (0.35 * (h - 1))) * abs(np.sin(np.pi * h * 0.18)) * 1.6
        y += amp * np.sin(2 * np.pi * fh * t + rng.uniform(0, 6.28)) * np.exp(-t * (1 / decay_s) * (1 + 0.45 * h))
    y *= 1 - np.exp(-t / 0.0015)
    return y


def ukulele(m, dur=0.9, vel=0.8):
    y = ks_fast(mtof(m), dur, bright=0.55, decay_s=0.9)
    y = hp(y, 180)
    return y * adsr(len(y), 0.001, 0.2, 1.0, 0.06) * vel * 0.25


def strum(notes, dur=0.9, vel=0.8, down=True, spread=0.014):
    seq = notes if down else notes[::-1]
    n = int((dur + spread * len(seq)) * SR)
    out = np.zeros(n)
    for i, m in enumerate(seq):
        s = ukulele(m, dur, vel * (1 - 0.06 * i))
        i0 = int(i * spread * SR)
        out[i0:i0 + len(s)] += s
    return out


def marimba(m, dur=0.8, vel=0.8):
    f = mtof(m)
    t = tt(dur)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * (3.2 + f / 900))
    y += 0.42 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * (14 + f / 300))
    y += 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40)
    y *= 1 - np.exp(-t / 0.0009)
    return y * vel * 0.34


def glock(m, dur=1.4, vel=0.6):
    f = mtof(m)
    t = tt(dur)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2)
    y += 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    y += 0.12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14)
    y *= 1 - np.exp(-t / 0.0008)
    return y * vel * 0.2


def pizz(m, dur=0.45, vel=0.8):
    y = ks_fast(mtof(m), dur, bright=0.35, decay_s=0.35)
    return lp(y, 3500) * vel * 0.3


def upright(m, dur=0.4, vel=0.9):
    f = mtof(m)
    t = tt(dur)
    y = np.sin(2 * np.pi * f * t) * 0.9 + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    e = np.exp(-t * 5.5) * (1 - np.exp(-t / 0.003))
    thump = lp(rng.standard_normal(len(t)) * np.exp(-t / 0.008), 600) * 0.25
    return (y * e + thump) * adsr(len(t), 0.002, 1, 1, 0.04) * vel * 0.32


def brass(notes, dur=0.6, vel=0.8):
    """Short synth-brass 'ta-da' stab (filtered saws with a filter envelope)."""
    t = tt(dur)
    y = np.zeros_like(t)
    for m in notes:
        for c in (-6, 0, 6):
            f = mtof(m) * 2 ** (c / 1200)
            y += 2 * ((f * t + rng.uniform()) % 1) - 1
    # crude moving filter: blend two lowpass versions
    a = lp(y, 900); b = lp(y, 3800)
    env_f = np.exp(-t * 6)
    y = a * (1 - env_f) + b * env_f
    return y * adsr(len(t), 0.02, 0.2, 0.75, 0.12) * vel * 0.06 / len(notes)


# ------------------------------------------------------------------ drums
def kick(vel=1.0):
    t = tt(0.35)
    f = 52 + 90 * np.exp(-t / 0.025)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14)
    return np.tanh(y * 1.5) * vel * 0.32


def snare(vel=1.0):
    t = tt(0.3)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.5
    noise = bp(rng.standard_normal(len(t)), 1200, 9000) * np.exp(-t / 0.09)
    return (tone + noise) * vel * 0.2


def clap(vel=1.0):
    t = tt(0.35)
    e = np.zeros_like(t)
    for d in (0.0, 0.008, 0.016):
        e += np.where(t >= d, np.exp(-(t - d) / 0.005), 0)
    e += np.where(t >= 0.022, np.exp(-(t - 0.022) / 0.08), 0) * 0.7
    return bp(rng.standard_normal(len(t)) * e, 1000, 6000) * vel * 0.24


def snap(vel=1.0):
    t = tt(0.12)
    y = bp(rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t / 0.012)
    y += np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.006) * 0.4
    return y * vel * 0.2


def shaker(vel=1.0):
    t = tt(0.08)
    e = np.sin(np.pi * np.clip(t / 0.055, 0, 1)) ** 2
    return bp(rng.standard_normal(len(t)), 5000, 11000) * e * vel * 0.06


def woodblock(m=84, vel=1.0):
    f = mtof(m)
    t = tt(0.15)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.018) + 0.4 * np.sin(2 * np.pi * f * 2.4 * t) * np.exp(-t / 0.01)
    return y * vel * 0.22


def crash(vel=1.0, dur=1.8):
    t = tt(dur)
    y = lp(hp(rng.standard_normal(len(t)), 3500), 11000) * np.exp(-t / 0.6)
    return y * vel * 0.09


# ------------------------------------------------------------------ cartoon SFX
def boing(m=55, dur=0.55, vel=1.0):
    t = tt(dur)
    f0 = mtof(m)
    f = f0 * (1 + 0.9 * np.exp(-t / 0.05)) * (1 + 0.06 * np.sin(2 * np.pi * 14 * t) * np.exp(-t / 0.25))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) * (1 - np.exp(-t / 0.002))
    return y * vel * 0.32


def pop(m=79, vel=1.0):
    t = tt(0.09)
    f = mtof(m) * (1.8 - 0.8 * np.clip(t / 0.05, 0, 1))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025)
    y += bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004) * 0.3
    return y * vel * 0.3


def slide_whistle(m0, m1, dur=0.5, vel=0.7):
    t = tt(dur)
    x = t / dur
    mm = m0 + (m1 - m0) * (x ** 0.9)
    f = mtof(mm) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.08 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)
    breath = bp(rng.standard_normal(len(t)), 1500, 6000) * 0.05
    e = np.sin(np.pi * np.clip(x, 0, 1)) ** 0.5
    return (y + breath) * e * vel * 0.16


def swish(dur=0.35, vel=1.0, up=True):
    t = tt(dur)
    x = t / dur
    noise = rng.standard_normal(len(t))
    lo = bp(noise, 400, 1800)
    hi = bp(noise, 1800, 8000)
    mix = lo * (1 - x) + hi * x if up else lo * x + hi * (1 - x)
    return mix * np.sin(np.pi * x) ** 1.3 * vel * 0.22


def kaching(key_notes=(84, 88, 91), vel=1.0):
    """Cash-register: drawer thunk + tuned bell chord + coin shimmer."""
    t = tt(1.4)
    thunk = lp(rng.standard_normal(len(t)) * np.exp(-t / 0.02), 900) * 0.6
    y = thunk
    for i, m in enumerate(key_notes):
        f = mtof(m)
        d = 0.045 + i * 0.0
        tb = np.clip(t - 0.06 - i * 0.012, 0, None)
        y += (np.sin(2 * np.pi * f * tb) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tb)) * np.exp(-tb * 3.2) * (t > 0.06 + i * 0.012) * 0.45
    shimmer = hp(rng.standard_normal(len(t)), 7000) * np.exp(-np.clip(t - 0.06, 0, None) / 0.25) * (t > 0.06) * 0.12
    return (y + shimmer) * vel * 0.3


def ding(m=88, vel=1.0):
    return glock(m, 1.2, vel * 1.5)


def bonk(vel=1.0):
    """Playful 'wrong answer': two descending woodblocks."""
    a = woodblock(76, vel)
    b = woodblock(71, vel * 0.9)
    out = np.zeros(int(0.32 * SR))
    out[:len(a)] += a
    i = int(0.12 * SR)
    out[i:i + len(b)] += b
    return out


def drumroll(dur=1.0, vel=1.0):
    t = tt(dur)
    y = np.zeros_like(t)
    hits = np.arange(0, dur, 1 / 28)
    for h in hits:
        s = snare(0.25 + 0.75 * (h / dur))
        i = int(h * SR)
        m = min(len(s), len(y) - i)
        y[i:i + m] += s[:m] * 0.6
    return y * vel


def sparkle(notes=(96, 100, 103, 108), vel=0.6, step=0.045):
    out = np.zeros(int((step * len(notes) + 1.0) * SR))
    for i, m in enumerate(notes):
        s = glock(m, 1.0, vel)
        j = int(i * step * SR)
        out[j:j + len(s)] += s
    return out


def typing(n=6, rate=0.07, vel=1.0):
    out = np.zeros(int((n * rate + 0.2) * SR))
    for i in range(n):
        s = woodblock(96 + (i % 3), vel * 0.35)
        j = int(i * rate * SR)
        out[j:j + len(s)] += s
    return out


def reverb(x, rt=1.6, pre=0.015, lpf=6000):
    n = int(rt * 1.4 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-t / (rt / 4.6))
    ir[:, :int(pre * SR)] = 0
    ir = lp(ir, lpf)
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
    return np.vstack([fftconvolve(x[0], ir[0])[:x.shape[1]], fftconvolve(x[1], ir[1])[:x.shape[1]]])
