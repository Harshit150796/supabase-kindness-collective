"""Original score + sound design for the CouponDonation launch film.

120 BPM, D major, 25.0 s. Bars land on t = 1, 3, 5, ... so every scene cut sits on a beat.
Everything is synthesized here (piano, supersaw pad, bass, drums, risers, whooshes,
UI ticks), with effects tuned to the key and sent to the same reverb as the music.
"""
import numpy as np
from scipy.signal import butter, lfilter, sosfilt, fftconvolve
import wave

SR = 48000
DUR = 79.2
N = int(SR * DUR)
BEAT = 0.6
rng = np.random.default_rng(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def S(t):
    return int(round(t * SR))


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t0, gain=1.0, pan=0.0):
        """Add mono (n,) or stereo (2,n) signal at time t0 with equal-power pan."""
        i0 = S(t0)
        if sig.ndim == 1:
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig * l, sig * r]) * np.sqrt(2)
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        n = min(sig.shape[1], N - i0)
        if n > 0:
            self.x[:, i0:i0 + n] += sig[:, :n] * gain


def lp(x, fc, order=2):
    sos = butter(order, min(fc, SR * 0.45) / (SR / 2), 'low', output='sos')
    return sosfilt(sos, x, axis=-1)


def hp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), 'high', output='sos')
    return sosfilt(sos, x, axis=-1)


def bp(x, f1, f2, order=2):
    sos = butter(order, [f1 / (SR / 2), min(f2, SR * 0.45) / (SR / 2)], 'band', output='sos')
    return sosfilt(sos, x, axis=-1)


def sweep_filter(x, fcs, kind='low', block=1024):
    """Time-varying 2-pole filter: fcs(t_sec_array) -> cutoff per block."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        fc = float(fcs((s + block / 2) / SR))
        b, a = butter(2, np.clip(fc, 30, SR * 0.45) / (SR / 2), kind)
        if zi is None:
            zi = np.zeros(max(len(a), len(b)) - 1)
        y[s:s + block], zi = lfilter(b, a, x[s:s + block], zi=zi)
    return y


def saw_blep(f, n, phase=0.0):
    dt = f / SR
    ph = (phase + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt
    t1 = ph[m1] / dt
    y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = ph > 1 - dt
    t2 = (ph[m2] - 1) / dt
    y[m2] -= t2 * t2 + t2 + t2 + 1
    return y


def env(n, a, r, hold=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if hold is not None:
        rel = np.clip((t - hold) / r, 0, 1)
        e *= (1 - rel) ** 2
    return e


# ------------------------------------------------------------------ instruments
def piano(m, dur=2.2, vel=0.8, bright=0.7):
    f0 = mtof(m)
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    B = 0.00025
    reg = (f0 / 261.6) ** 0.35
    for k in range(1, 16):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        amp = (1.0 / k ** 1.25) * (bright ** ((k - 1) * 0.5))
        dec = (0.9 + 0.75 * k) * reg
        y += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t * dec)
    # slow "singing" component of the fundamental
    y += 0.35 * np.sin(2 * np.pi * f0 * t) * np.exp(-t * 0.6 * reg)
    hammer = lp(rng.standard_normal(n) * np.exp(-t / 0.003), 2500) * 0.08
    y = (y + hammer) * (1 - np.exp(-t / 0.0015))
    y *= env(n, 0.001, 0.12, hold=dur - 0.12)
    return y * vel * 0.32


def mallet(m, dur=1.2, vel=0.6):
    """Soft tuned mallet/bell used for UI ticks so effects sit in key."""
    f0 = mtof(m)
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f0 * t) * np.exp(-t * 4.5)
    y += 0.35 * np.sin(2 * np.pi * f0 * 3.0 * t) * np.exp(-t * 14)
    y += 0.12 * np.sin(2 * np.pi * f0 * 4.16 * t) * np.exp(-t * 22)
    y *= 1 - np.exp(-t / 0.0012)
    return y * vel * 0.3


def bell(m, dur=4.0, vel=0.7):
    f0 = mtof(m)
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t * 2.5)
    y = np.sin(2 * np.pi * f0 * t + idx * np.sin(2 * np.pi * f0 * 3.5 * t))
    y *= np.exp(-t * 1.1) * (1 - np.exp(-t / 0.002))
    return y * vel * 0.25


def supersaw_chord(notes, dur, cutoff, a=0.35, r=0.9, gain=1.0):
    n = int((dur + r) * SR)
    out = np.zeros((2, n))
    for j, m in enumerate(notes):
        for v, c in enumerate([-13, -6, 0, 6, 13]):
            f = mtof(m) * 2 ** (c / 1200)
            s = saw_blep(f, n, rng.uniform(0, 1))
            pan = ((v - 2) / 2.0) * 0.8
            out[0] += s * np.cos((pan + 1) * np.pi / 4)
            out[1] += s * np.sin((pan + 1) * np.pi / 4)
    e = env(n, a, r, hold=dur)
    if callable(cutoff):
        out = np.vstack([sweep_filter(out[0], cutoff), sweep_filter(out[1], cutoff)])
    else:
        out = lp(out, cutoff, 2)
    return out * e * gain / (len(notes) * 5) * 0.9


def bass_note(m, dur, vel=1.0):
    n = int((dur + 0.05) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    sub = np.sin(2 * np.pi * f * t) * 0.75
    body = lp(saw_blep(f * 2, n), 650, 2) * 0.55
    e = np.minimum(1, t / 0.004) * np.where(t < dur, 1.0, np.clip(1 - (t - dur) / 0.05, 0, 1))
    e *= 0.75 + 0.25 * np.exp(-t * 8)
    return (sub + body) * e * vel * 0.13


def kick(vel=1.0):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t / 0.028)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.2)
    click = hp(rng.standard_normal(n) * np.exp(-t / 0.0018), 1500) * 0.25
    return np.tanh((y + click) * 1.4) * vel * 0.36


def clap(vel=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    e = np.zeros(n)
    for d in (0.0, 0.009, 0.018):
        e += np.where(t >= d, np.exp(-(t - d) / 0.006), 0)
    e += np.where(t >= 0.026, np.exp(-(t - 0.026) / 0.11), 0) * 0.8
    y = bp(noise * e, 900, 5200)
    return y * vel * 0.30


def hat(vel=1.0, open_=False):
    n = int((0.35 if open_ else 0.08) * SR)
    t = np.arange(n) / SR
    y = hp(rng.standard_normal(n), 7000) * np.exp(-t / (0.09 if open_ else 0.022))
    return lp(y, 13000) * vel * 0.2


def shaker(vel=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / 0.06, 0, 1)) ** 2
    return bp(rng.standard_normal(n), 4500, 11000) * e * vel * 0.06


def crash(vel=1.0, dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = hp(rng.standard_normal(n), 3500) * np.exp(-t / 0.7)
    y = lp(y, 11000)
    return y * vel * 0.10


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = t / dur
    noise = rng.standard_normal(n)
    y = sweep_filter(noise, lambda s: 250 * (6000 / 250) ** (s / dur) * 1.0, 'low')
    y = hp(y, 180)
    amp = x ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (x * 1.0)) / SR) * 0.15 * x ** 3
    return (y * 0.55 + tone) * amp * 0.5


def whoosh(dur=0.6, f1=300, f2=3500, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = t / dur
    noise = rng.standard_normal(n)
    y = sweep_filter(noise, lambda s: f1 * (f2 / f1) ** np.clip(s / dur, 0, 1), 'low')
    y = hp(y, 150)
    e = np.sin(np.pi * x) ** 1.6
    return y * e * vel * 0.22


def boom(vel=1.0):
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    f = 34 + 40 * np.exp(-t / 0.08)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    thump = lp(rng.standard_normal(n) * np.exp(-t / 0.05), 700) * 0.4
    return np.tanh((y + thump) * 1.6) * vel * 0.5


def paper(vel=1.0):
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 1800, 6000) * np.exp(-t / 0.012) * vel * 0.12


def click(m, vel=1.0):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * mtof(m) * t) * np.exp(-t / 0.025)
    y += lp(rng.standard_normal(n) * np.exp(-t / 0.0015), 4000) * 0.3
    return y * vel * 0.16


# ------------------------------------------------------------------ arrangement
