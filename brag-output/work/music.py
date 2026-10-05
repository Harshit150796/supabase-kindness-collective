"""Original score + sound design for the CouponDonation launch film.

120 BPM, D major, 25.0 s. Bars land on t = 1, 3, 5, ... so every scene cut sits on a beat.
Everything is synthesized here (piano, supersaw pad, bass, drums, risers, whooshes,
UI ticks), with effects tuned to the key and sent to the same reverb as the music.
"""
import numpy as np
from scipy.signal import butter, lfilter, sosfilt, fftconvolve
import wave

SR = 48000
DUR = 25.0
N = int(SR * DUR)
BEAT = 0.5
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
D = [50, 57, 62, 66, 69]
A_ = [49, 57, 61, 64, 69]       # A/C#
Bm = [47, 54, 59, 62, 66]
G = [43, 50, 55, 59, 62, 69]
Asus = [45, 52, 57, 62, 64]
A = [45, 52, 57, 61, 64]
CH = [  # (start, end, chord, bass root, arp tones)
    (0.0, 3.0, Bm, 35, [71, 74, 78, 83]),
    (3.0, 5.0, D, 38, [74, 78, 81, 86]),
    (5.0, 7.0, A_, 37, [73, 76, 81, 85]),
    (7.0, 9.0, Bm, 35, [71, 74, 78, 83]),
    (9.0, 11.0, G, 31, [71, 74, 79, 83]),
    (11.0, 13.0, D, 38, [74, 78, 81, 86]),
    (13.0, 15.0, A, 33, [73, 76, 81, 85]),
    (15.0, 17.0, Bm, 35, [71, 74, 78, 83]),
    (17.0, 19.0, G, 31, [71, 74, 79, 83]),
    (19.0, 21.0, D, 38, [74, 78, 81, 86]),
    (21.0, 22.0, Asus, 33, [74, 76, 81, 86]),
    (22.0, 23.0, A, 33, [73, 76, 81, 85]),
    (23.0, 25.0, D, 38, [74, 78, 81, 86]),
]

pad, keys, bass, drums, fx, rev = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()
kicks = []

# Pad: closed and dark in the intro, opening on the drop, biggest under the tree.
for (t0, t1, ch, root, arp) in CH:
    dur = t1 - t0
    if t0 == 0.0:
        sig = supersaw_chord(ch, 2.9, lambda s: 380 + 1400 * (s / 2.9) ** 2, a=0.9, r=0.06, gain=0.5)
    elif t0 in (7.0, 9.0):
        sig = supersaw_chord(ch + [ch[2] + 12], dur, 4800, a=0.25, r=1.0, gain=1.25)
    elif t0 >= 23.0:
        sig = supersaw_chord(ch + [ch[2] + 12], 1.6, lambda s: 3000 - 1800 * min(1, s / 2.4), a=0.05, r=1.6, gain=1.25)
    elif t0 >= 21.0:
        sig = supersaw_chord(ch, dur, 3000, a=0.2, r=0.6, gain=1.0)
    else:
        sig = supersaw_chord(ch, dur, 3800, a=0.18, r=0.8, gain=1.0)
    pad.add(sig, t0, gain=1.5)
    rev.add(sig, t0, gain=0.6)

# Piano: sparse question notes in the intro, then flowing arpeggios.
for tt, m in [(0.0, 71), (0.5, 66), (1.0, 74), (1.75, 73), (2.0, 78), (2.5, 76)]:
    s = piano(m, 2.4, vel=0.36, bright=0.8)
    keys.add(s, tt, pan=-0.15)
    rev.add(s, tt, 0.6)
for (t0, t1, ch, root, arp) in CH:
    if t0 == 0.0:
        continue
    if t0 >= 21.0:
        # outro: block chords, held
        if t0 in (21.0, 23.0):
            for j, m in enumerate(ch[1:] + [arp[-1]]):
                s = piano(m + (12 if m < 60 else 0), 3.5 if t0 == 23.0 else 2.0, vel=0.75, bright=0.85)
                keys.add(s, t0 + j * 0.012, pan=-0.3 + j * 0.15)
                rev.add(s, t0, 0.7)
        continue
    step = 0.25 if t0 in (7.0, 9.0, 15.0, 17.0) else 0.5
    pat = [0, 1, 2, 3, 2, 1, 2, 3] if step == 0.5 else [0, 1, 2, 3, 1, 2, 3, 2, 0, 1, 2, 3, 1, 2, 3, 1]
    nsteps = int(round((t1 - t0) / step))
    for i in range(nsteps):
        m = arp[pat[i % len(pat)]]
        if step == 0.25 and i % 8 >= 4 and t0 in (15.0, 17.0):
            m += 12 if m < 84 else 0  # lift during "see where every dollar goes"
        v = 0.62 if i % (4 if step == 0.25 else 2) == 0 else 0.45
        s = piano(m, 1.6, vel=v * 1.35, bright=0.88)
        tt = t0 + i * step
        keys.add(s, tt, pan=-0.35 + 0.7 * (pat[i % len(pat)] / 3))
        rev.add(s, tt, 0.45)

# Bass: drone in intro, driving 8ths from the drop, sustained outro.
bass.add(bass_note(35, 2.9, 0.45), 0.0)
for (t0, t1, ch, root, arp) in CH:
    if t0 == 0.0:
        continue
    if t0 >= 21.5 or t0 == 21.0:
        if t0 == 21.0:
            bass.add(bass_note(root, 0.95, 0.6), 21.0)
        else:
            bass.add(bass_note(root, 1.9, 0.7), t0)
        continue
    n8 = int(round((t1 - t0) / 0.25))
    for i in range(n8):
        tt = t0 + i * 0.25
        m = root + (12 if i % 4 == 3 else 0)
        bass.add(bass_note(m, 0.2, 0.95 if i % 2 == 0 else 0.75), tt)
bass.add(bass_note(33, 0.95, 0.6), 22.0)

# Drums
def bars(t0, t1):
    t = t0
    while t < t1 - 1e-6:
        yield t
        t += 2.0

for b in bars(3.0, 21.0):
    half = 7.0 <= b < 11.0
    for i in range(4):
        tt = b + i * 0.5
        if half and i in (1, 3):
            continue
        drums.add(kick(1.0), tt)
        kicks.append(tt)
    if half:
        c = clap(1.1)
        drums.add(c, b + 1.0, pan=0.05)
        rev.add(c, b + 1.0, 0.5)
    else:
        for i in (1, 3):
            c = clap(1.0)
            drums.add(c, b + i * 0.5, pan=0.05)
            rev.add(c, b + i * 0.5, 0.35)
    for i in range(4):
        drums.add(hat(0.9), b + i * 0.5 + 0.25, pan=0.3)
    if b >= 11.0:
        for i in range(16):
            drums.add(shaker(1.0 if i % 2 else 0.6), b + i * 0.125, pan=-0.35)
    if b in (5.0, 17.0):
        drums.add(hat(0.8, open_=True), b + 1.75, pan=0.3)
# fills into big moments
for tt in np.arange(10.5, 11.0, 0.125):
    drums.add(clap(0.35 + 0.5 * (tt - 10.5)), tt, pan=0.1)
for tt in np.arange(20.5, 21.0, 0.125):
    drums.add(clap(0.3 + 0.6 * (tt - 20.5)), tt, pan=-0.1)
drums.add(kick(1.0), 21.0); kicks.append(21.0)
drums.add(kick(0.9), 22.0); kicks.append(22.0)
drums.add(kick(1.0), 23.0); kicks.append(23.0)
for tt, v in [(3.0, 1.0), (7.0, 0.9), (11.0, 0.6), (15.0, 0.6), (23.0, 0.8)]:
    c = crash(v)
    drums.add(c, tt, pan=-0.2)
    rev.add(c, tt, 0.3)

# Intro clock: soft ticking 8ths, tuned
for i in range(6):
    tt = i * 0.5
    s = click(83 if i % 2 == 0 else 78, 0.55)
    fx.add(s, tt, pan=0.25 if i % 2 else -0.25)
    rev.add(s, tt, 0.3)

# ------------------------------------------------------------------ sound design (timed to picture)
fx.add(riser(1.32), 1.6, gain=0.9)
rev.add(riser(1.32), 1.6, 0.4)
fx.add(boom(1.0), 3.0)
rev.add(boom(0.6), 3.0, 0.25)
# coupons landing: paper flicks + tuned ticks (D major pentatonic)
penta = [86, 88, 90, 93, 95, 98, 93, 90, 98]
for i in range(9):
    land = 3.04 + i * 0.0625 + 0.26
    pan = [-0.6, 0.0, 0.6][i % 3]
    fx.add(paper(1.0), land - 0.03, pan=pan)
    s = mallet(penta[i], 0.8, 0.35)
    fx.add(s, land, pan=pan)
    rev.add(s, land, 0.5)
# transitions
for tt, f1, f2, pan, v in [(6.55, 300, 5000, 0.0, 1.0), (10.6, 250, 4200, 0.0, 0.9), (14.62, 250, 4200, 0.0, 0.85), (21.12, 220, 3600, 0.0, 0.85)]:
    w = whoosh(0.7, f1, f2, v)
    fx.add(w, tt, pan=pan)
    rev.add(w, tt, 0.3)
# horizontal push into the apply scene: whoosh travels right -> left
w = whoosh(0.7, 280, 4500, 0.9)
half = len(w) // 2
fx.add(w[:half], 18.1, pan=0.6)
fx.add(w[half:], 18.1 + half / SR, pan=-0.4)
# kicker word changes
for tt, m in [(7.15, 81), (8.55, 83), (9.85, 86)]:
    s = mallet(m, 1.2, 0.45)
    fx.add(s, tt, pan=0.0)
    rev.add(s, tt, 0.6)
# UI taps (in key)
for tt, m in [(11.7, 81), (12.15, 83), (12.6, 86), (13.05, 88), (19.3, 81), (19.9, 86), (20.5, 88)]:
    fx.add(click(m, 0.9), tt, pan=0.2)
    s = mallet(m + 12, 0.6, 0.18)
    fx.add(s, tt, pan=0.2)
    rev.add(s, tt, 0.4)
# "9 coupons created"
s = bell(90, 2.5, 0.45)
fx.add(s, 14.05, pan=0.1)
rev.add(s, 14.05, 0.6)
# ring drawing: shimmer glissando up the D major scale
scale = [74, 76, 78, 79, 81, 83, 85, 86, 88, 90, 91, 93]
for i, m in enumerate(scale):
    tt = 15.2 + 1.2 * (i / len(scale)) ** 0.8
    s = mallet(m + 12, 0.9, 0.16)
    fx.add(s, tt, pan=-0.5 + i / len(scale))
    rev.add(s, tt, 0.7)
# trace steps
for tt, m in zip([15.9, 16.333, 16.767, 17.2], [86, 88, 90, 93]):
    s = mallet(m, 1.0, 0.42)
    fx.add(s, tt, pan=-0.3 + (m - 86) / 20)
    rev.add(s, tt, 0.5)
# outro buttons + logo hit
for tt, m in [(22.45, 86), (22.57, 90)]:
    s = mallet(m, 0.8, 0.3)
    fx.add(s, tt)
    rev.add(s, tt, 0.5)
for m in (74, 78, 81, 86):
    s = bell(m, 4.0, 0.42)
    fx.add(s, 23.0, pan=(m - 80) / 14)
    rev.add(s, 23.0, 0.7)
fx.add(boom(0.6), 23.0)

# ------------------------------------------------------------------ mix
t = np.arange(N) / SR
duck = np.ones(N)
for kt in kicks:
    i0 = S(kt)
    seg = np.arange(N - i0) / SR
    duck[i0:] *= 1 - 0.55 * np.exp(-seg / 0.11)
# pad also breathes out of the way of the riser gap before the drop
gap = 1 - 0.85 * np.clip(1 - np.abs(t - 2.96) / 0.05, 0, 1)

ir_n = int(2.6 * SR)
ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal((2, ir_n)) * np.exp(-ir_t / 0.55)
ir[:, :int(0.018 * SR)] = 0
ir = lp(ir, 6500)
ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
send = hp(rev.x, 220)
wet = np.vstack([fftconvolve(send[0], ir[0])[:N], fftconvolve(send[1], ir[1])[:N]])

mix = (pad.x * duck * gap * 1.0 +
       bass.x * duck * 1.0 +
       keys.x * 0.95 +
       drums.x * 0.9 +
       fx.x * 1.0 +
       wet * 0.32)
mix = hp(mix, 28)

# gentle glue compression (RMS, ratio 2:1 above threshold)
win = int(0.03 * SR)
rms = np.sqrt(np.convolve((mix ** 2).mean(axis=0), np.ones(win) / win, mode='same') + 1e-12)
db = 20 * np.log10(rms)
thr = -15.0
gr_db = np.where(db > thr, (db - thr) * (1 - 1 / 2.0), 0.0)
gr = 10 ** (-gr_db / 20)
gr = lfilter([0.002], [1, -0.998], gr)  # smooth
mix *= gr

# fade tail
fade = np.clip((DUR - t) / 0.9, 0, 1) ** 1.5
mix *= fade
mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))

# normalize to a safe peak; final loudness is set by ffmpeg loudnorm
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.05) / np.tanh(1.05) * 0.89

out = (mix.T * 32767).astype(np.int16)
with wave.open('score.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print('wrote score.wav', out.shape, 'peak', float(np.max(np.abs(mix))))

if __import__('os').environ.get('ANALYZE'):
    secs = [(0, 1.5), (1.5, 2.9), (3, 7), (7, 11), (11, 15), (15, 18.5), (18.5, 21.3), (21.3, 23), (23, 25)]
    stems = {'pad': pad.x * duck * gap, 'bass': bass.x * duck, 'keys': keys.x * 0.95, 'drums': drums.x * 0.9, 'fx': fx.x, 'wet': wet * 0.32}
    print('section      ' + ' '.join(f'{k:>7}' for k in stems))
    for a, b in secs:
        row = []
        for k, v in stems.items():
            seg = v[:, S(a):S(b)]
            row.append(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9))
        print(f'{a:5.1f}-{b:5.1f}  ' + ' '.join(f'{r:7.1f}' for r in row))
    # spectrum balance of the final mix per section
    for a, b in secs:
        seg = mix[:, S(a):S(b)].mean(axis=0)
        sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2
        fr = np.fft.rfftfreq(len(seg), 1 / SR)
        band = lambda lo, hi: 10 * np.log10(sp[(fr >= lo) & (fr < hi)].sum() + 1e-9)
        tot = band(20, 20000)
        print(f'{a:5.1f}-{b:5.1f} sub<60 {band(20,60)-tot:6.1f}  low60-250 {band(60,250)-tot:6.1f}  mid250-2k {band(250,2000)-tot:6.1f}  pres2-6k {band(2000,6000)-tot:6.1f}  air>6k {band(6000,20000)-tot:6.1f}')
