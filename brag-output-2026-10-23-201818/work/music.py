"""Original score + sound design for the launch film of the new coupondonation.com.

D major, 100 BPM (beat 0.6 s, bar 2.4 s), 79.2 s = 33 bars counted from frame 0, so every scene
cut lands on a bar line. Instruments are synthesized in inst.py (piano, supersaw pad, bass, drums,
mallets, bells, risers, whooshes). Effects share the key, the beat grid and the reverb send.
Picture cues come from cues.json (exported from the composition by dump-cues.mjs).
Usage: python3 music.py [out.wav]   (ANALYZE=1 prints a per-section level table)
"""
import os, sys, json, wave
import numpy as np
from scipy.signal import lfilter, fftconvolve
from inst import *  # noqa: F401,F403  (SR, DUR, N, S, Bus, piano, mallet, bell, supersaw_chord, bass_note, kick, clap, hat, shaker, crash, riser, whoosh, boom, paper, click, lp, hp, rng)

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'cues.json')))
T = C['T']
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'score.wav')
B8, BAR = 0.3, 2.4
bt = lambda bar, beat=0: bar * BAR + beat * 0.6

# chords: (voicing, bass root)
D = ([50, 57, 62, 66, 69], 38); A = ([49, 57, 61, 64, 69], 33); Bm = ([47, 54, 59, 62, 66], 35)
G = ([43, 50, 55, 59, 62, 69], 31); Asus = ([45, 52, 57, 62, 64], 33); Dsus = ([50, 57, 62, 64, 69], 38)
PROG = [D, Bm, G, Asus,            # 0-3   hook + opening
        D, A,                      # 4-5   the tree
        D, A, Bm, G,               # 6-9   give what people need (groove in)
        D, A, Bm, G, Asus,         # 10-14 donate
        Bm, G, Asus,               # 15-17 100% (lift)
        D, A, Bm, G,               # 18-21 we track the money
        D, A, Bm, G,               # 22-25 people who need help
        G, Asus,                   # 26-27 security (build)
        D, A, Bm, G,               # 28-31 finale chorus (day tree, CTA)
        D]                         # 32    end card
ARP = {id(D): [74, 78, 81, 86], id(A): [73, 76, 81, 85], id(Bm): [71, 74, 78, 83], id(G): [71, 74, 79, 83],
       id(Asus): [74, 76, 81, 86], id(Dsus): [74, 76, 81, 86]}

pad, keys, bass, drums, fx, rev = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()
kicks = []
GROOVE = [(6, 15), (18, 26), (28, 31)]          # full-groove bar ranges [a, b)
LIGHT = range(22, 26)                           # apply: lighter drums (no claps on 2, shaker only)
PULSE = range(15, 18)                           # 100%: kick pulse only, riser into bar 18
BUILD = range(26, 28)
in_groove = lambda b: any(a <= b < c for a, c in GROOVE)

# ---- pad: dark and closed under the hook, opening on the opening's reveal, widest in the choruses
for b, (ch, root) in enumerate(PROG):
    t0 = bt(b)
    dur = BAR if b < 32 else 4.6
    if b <= 1:
        sig = supersaw_chord(ch, BAR, lambda s: 320 + 900 * (s / BAR) ** 2, a=0.9, r=0.4, gain=0.55)
    elif b <= 5:
        sig = supersaw_chord(ch, BAR, 2200 + 500 * (b - 2), a=0.4, r=0.8, gain=0.85)
    elif b in PULSE:
        sig = supersaw_chord(ch + [ch[2] + 12], BAR, lambda s, b=b: 1600 + 2600 * ((b - 15) * BAR + s) / (3 * BAR), a=0.2, r=0.6, gain=1.05)
    elif b >= 28 and b < 32:
        sig = supersaw_chord(ch + [ch[2] + 12], BAR, 5200, a=0.15, r=0.9, gain=1.25)
    elif b == 32:
        sig = supersaw_chord(ch + [ch[2] + 12], dur, lambda s: 4200 - 2600 * min(1, s / 4.0), a=0.05, r=1.6, gain=1.15)
    else:
        sig = supersaw_chord(ch, BAR, 3800, a=0.18, r=0.8, gain=0.95)
    pad.add(sig, t0, gain=1.5)
    rev.add(sig, t0, gain=0.55)

# ---- piano: sparse, singing notes under the hook and the opening, then arpeggios
for tt, m, v in [(0.0, 74, .42), (0.6, 78, .3), (1.2, 81, .34), (2.4, 83, .44), (3.0, 81, .3), (3.6, 78, .3),
                 (4.8, 79, .4), (5.4, 74, .28), (6.0, 83, .32), (7.2, 81, .38), (7.8, 76, .28), (8.4, 85, .32),
                 (9.6, 86, .42), (10.8, 85, .3), (12.0, 81, .36), (13.2, 85, .3)]:
    s = piano(m, 3.0, vel=v, bright=0.82)
    keys.add(s, tt, pan=-0.1)
    rev.add(s, tt, 0.65)
for b, (ch, root) in enumerate(PROG):
    if b < 6 or b in PULSE or b >= 32:
        continue
    arp = ARP[id(PROG[b])]
    if b in BUILD:
        step, pat = 0.15, [0, 1, 2, 3] * 4
    elif b in LIGHT:
        step, pat = 0.3, [0, 2, 1, 3, 2, 1, 3, 2]
    else:
        step, pat = 0.15, [0, 1, 2, 3, 1, 2, 3, 2, 0, 1, 2, 3, 1, 2, 3, 1]
    for i in range(int(round(BAR / step))):
        m = arp[pat[i % len(pat)]]
        if b >= 28 and i % 8 >= 4:
            m += 12 if m < 84 else 0
        v = 0.6 if i % 4 == 0 else 0.42
        s = piano(m, 1.4, vel=v * 0.8, bright=0.88)
        tt = bt(b) + i * step
        keys.add(s, tt, pan=-0.35 + 0.7 * (pat[i % len(pat)] / 3))
        rev.add(s, tt, 0.42)
# warm piano lead over the recipients section (bars 22-25)
lead = [(0, 86), (1, 85), (1.5, 83), (2, 81), (3, 78), (4, 79), (5, 81), (6, 83), (7, 85), (8, 86), (9, 88), (10, 86), (11, 83),
        (12, 79), (13, 81), (14, 83), (15, 81)]
for beat, m in lead:
    tt = bt(22) + beat * 0.6
    s = piano(m, 2.2, vel=0.5, bright=0.85)
    keys.add(s, tt, pan=0.15); rev.add(s, tt, 0.6)
# CTA melody (bars 28-31) doubled in octaves
for beat, m in [(0, 86), (2, 88), (3, 90), (4, 85), (6, 88), (7, 85), (8, 83), (10, 86), (11, 83), (12, 79), (13, 81), (14, 83), (15, 85)]:
    tt = bt(28) + beat * 0.6
    for o, v in [(0, 0.55), (-12, 0.35)]:
        s = piano(m + o, 2.0, vel=v, bright=0.9)
        keys.add(s, tt, pan=0.1); rev.add(s, tt, 0.55)

# ---- bass: drone at the start, eighths in the groove, held under the lift and the end card
bass.add(bass_note(38, 4.6, 0.4), 0.0)
for b, (ch, root) in enumerate(PROG):
    t0 = bt(b)
    if b < 2:
        continue
    if b < 6 or b in PULSE:
        bass.add(bass_note(root, BAR - 0.05, 0.55), t0)
        continue
    if b == 32:
        bass.add(bass_note(root, 4.4, 0.7), t0)
        continue
    for i in range(8):
        m = root + (12 if i % 4 == 3 else 0)
        v = 0.95 if i % 2 == 0 else 0.72
        if b in LIGHT and i % 2:
            continue
        bass.add(bass_note(m, 0.26, v), t0 + i * B8)

# ---- drums
for b in range(33):
    t0 = bt(b)
    if in_groove(b):
        light = b in LIGHT
        for i in range(4):
            if light and i in (1, 3):
                continue
            drums.add(kick(1.0), t0 + i * 0.6); kicks.append(t0 + i * 0.6)
        for i in (1, 3):
            if light:
                continue
            c = clap(0.95); drums.add(c, t0 + i * 0.6, pan=0.05); rev.add(c, t0 + i * 0.6, 0.35)
        for i in range(4):
            drums.add(hat(0.85), t0 + i * 0.6 + 0.3, pan=0.3)
        for i in range(16):
            drums.add(shaker(1.0 if i % 2 else 0.55), t0 + i * 0.15, pan=-0.35)
    elif b in PULSE:
        for i in range(4):
            drums.add(kick(0.7), t0 + i * 0.6); kicks.append(t0 + i * 0.6)
    elif b in BUILD:
        for i in range(4):
            drums.add(kick(0.9), t0 + i * 0.6); kicks.append(t0 + i * 0.6)
        rate = 0.3 if b == 26 else 0.15
        for tt in np.arange(t0, t0 + BAR - 1e-6, rate):
            v = 0.3 + 0.6 * ((tt - bt(26)) / (2 * BAR))
            c = clap(v); drums.add(c, tt, pan=0.08); rev.add(c, tt, 0.25)
# fills into big moments
for bar in (14, 21, 27):
    for tt in np.arange(bt(bar, 3), bt(bar + 1) - 1e-6, 0.15):
        drums.add(clap(0.35 + 0.8 * (tt - bt(bar, 3)) / 0.6), tt, pan=-0.1)
for tt, v in [(bt(6), 0.9), (bt(10), 0.6), (bt(18), 0.95), (bt(22), 0.5), (bt(28), 1.0), (bt(32), 0.8)]:
    c = crash(v); drums.add(c, tt, pan=-0.2); rev.add(c, tt, 0.3)
drums.add(kick(1.0), bt(32)); kicks.append(bt(32))

# ---- sound design (timed to picture)
def tick(tt, m, v=0.8, pan=0.15):
    fx.add(click(m, v), tt, pan=pan)
    s = mallet(m + 12, 0.6, 0.16 * v); fx.add(s, tt, pan=pan); rev.add(s, tt, 0.4)

def swoosh(tt, dur=0.6, f1=280, f2=4200, v=0.85, pan=0.0):
    w = whoosh(dur, f1, f2, v); fx.add(w, tt - dur / 2, pan=pan); rev.add(w, tt - dur / 2, 0.3)

# hook: "All of it." bell, underline shimmer, riser into the opening
s = bell(86, 3.5, 0.42); fx.add(s, T['allOf']); rev.add(s, T['allOf'], 0.7)
for i, m in enumerate([86, 88, 90, 93, 95]):
    tt = T['underline'] + i * 0.12
    s = mallet(m + 12, 0.9, 0.12); fx.add(s, tt, pan=-0.4 + i * 0.2); rev.add(s, tt, 0.6)
fx.add(riser(1.6), 3.2, gain=0.55); rev.add(riser(1.6), 3.2, 0.3)
swoosh(4.65, 0.5, 300, 5200, 0.7)                     # paper wipes up
fx.add(boom(0.35), 4.8)
# opening: lockup sheen, the caption, the fly onto the navbar and its landing
for i, m in enumerate([93, 97, 100, 105]):
    tt = 5.22 + i * 0.06
    s = mallet(m, 1.2, 0.12); fx.add(s, tt, pan=0.3 - i * 0.2); rev.add(s, tt, 0.7)
tick(T['introCap'] + 0.1, 81, 0.35)
swoosh(7.55, 0.7, 260, 3800, 0.75, -0.3)              # lockup flies to the nav
tick(7.93, 86, 0.5, -0.5)                             # lands on the nav brand
s = mallet(88, 1.0, 0.3); fx.add(s, 8.4); rev.add(s, 8.4, 0.6)   # kicker word slides
# tree: coupon drop, plant grows, kicker words
s = mallet(93, 1.2, 0.28); fx.add(s, 10.07, pan=0.2); rev.add(s, 10.07, 0.6)
fx.add(paper(0.8), 11.0, pan=0.4)
for i, m in enumerate([86, 90, 93, 98]):
    tt = 11.35 + i * 0.09
    s = mallet(m, 1.0, 0.16); fx.add(s, tt, pan=0.45); rev.add(s, tt, 0.7)
for tt, m in [(11.4, 85), (13.0, 88)]:
    s = mallet(m, 1.0, 0.24); fx.add(s, tt); rev.add(s, tt, 0.6)
fx.add(riser(1.8), 12.6, gain=0.6)
# scroll / wipe transitions
for tt, pan in [(14.4, 0.0), (24.0, 0.0), (36.0, 0.0), (43.2, 0.0), (52.8, 0.4), (62.2, 0.0), (67.05, 0.0), (69.5, 0.0), (74.3, 0.0)]:
    swoosh(tt, 0.6, 260, 4000, 0.65, pan)
# give: four cards deal and flip
for i, tt in enumerate(T['deal']):
    fx.add(paper(1.0), tt + 0.05, pan=-0.5 + i * 0.33)
    s = mallet([81, 85, 88, 93][i], 0.9, 0.3); fx.add(s, tt + 0.55, pan=-0.5 + i * 0.33); rev.add(s, tt + 0.55, 0.5)
# donate: taps, continue, $50, ledger opens, review, the 100% marker
for i, tt in enumerate(T['taps']):
    tick(tt, [81, 83, 86][i], 0.85)
tick(T['toAmount'], 88, 0.8)
tick(T['amt50'], 90, 0.9)
for i, m in enumerate([74, 78, 81, 86]):
    s = bell(m + 12, 2.2, 0.16); fx.add(s, T['ledger'] + 0.1 + i * 0.07, pan=0.3); rev.add(s, T['ledger'] + 0.1 + i * 0.07, 0.6)
tick(T['toReview'], 88, 0.8)
for i, m in enumerate([86, 88, 90, 93, 95, 98]):
    tt = T['summary'] + 1.0 + i * 0.08
    s = mallet(m + 12, 0.8, 0.12); fx.add(s, tt, pan=-0.3 + i * 0.12); rev.add(s, tt, 0.6)
# 100%: riser as it fills, ticks on the two promises, hit into the money line
fx.add(riser(T['fill'][1] - T['fill'][0] + 0.2), T['fill'][0], gain=0.7)
s = bell(86, 3.0, 0.4); fx.add(s, T['fill'][1]); rev.add(s, T['fill'][1], 0.7)
for i in range(2):
    tick(T['promises'] + i * 0.3, [86, 90][i], 0.45)
fx.add(riser(2.2), bt(17, 0.4), gain=0.65)
fx.add(boom(0.6), bt(18)); rev.add(boom(0.4), bt(18), 0.2)
# journey stops
for i, tt in enumerate(T['stops']):
    s = mallet([81, 85, 88, 93][i], 1.0, 0.4); fx.add(s, tt, pan=-0.45 + i * 0.3); rev.add(s, tt, 0.5)
    fx.add(paper(0.6), tt - 0.02, pan=-0.45 + i * 0.3)
# apply: taps, then "Free to apply."
for i, tt in enumerate(T['needs'] + T['stores']):
    tick(tt, [81, 85, 83, 86, 88][i], 0.8, 0.2)
for i, m in enumerate([74, 78, 81, 86, 90]):
    s = bell(m + 12, 2.5, 0.15); fx.add(s, T['freeLine'] + 0.45 + i * 0.06); rev.add(s, T['freeLine'] + 0.45 + i * 0.06, 0.7)
# security badges, then the build
for i, tt in enumerate(T['badges']):
    tick(tt, [83, 86, 90][i], 0.5)
fx.add(riser(2.6), bt(26, 3), gain=0.75)
fx.add(boom(0.7), bt(28))
# CTA + end card
for i, tt in enumerate([T['ctaBtns'], T['ctaBtns'] + 0.15]):
    tick(tt, [86, 90][i], 0.55)
for m in (74, 78, 81, 86):
    s = bell(m, 4.5, 0.4); fx.add(s, bt(31), pan=(m - 80) / 14); rev.add(s, bt(31), 0.7)
fx.add(boom(0.55), bt(31))
s = bell(90, 3.2, 0.28); fx.add(s, T['endUrl']); rev.add(s, T['endUrl'], 0.7)

# ------------------------------------------------------------------ mix
t = np.arange(N) / SR
duck = np.ones(N)
for kt in kicks:
    i0 = S(kt)
    seg = np.arange(N - i0) / SR
    duck[i0:] *= 1 - 0.5 * np.exp(-seg / 0.11)
ir_n = int(2.8 * SR)
ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal((2, ir_n)) * np.exp(-ir_t / 0.6)
ir[:, :int(0.02 * SR)] = 0
ir = lp(ir, 6500)
ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
send = hp(rev.x, 220)
wet = np.vstack([fftconvolve(send[0], ir[0])[:N], fftconvolve(send[1], ir[1])[:N]])
stems = {'pad': pad.x * duck * 0.9, 'bass': bass.x * duck, 'keys': keys.x * 0.95, 'drums': drums.x * 0.85, 'fx': fx.x * 0.95, 'wet': wet * 0.3}
mix = sum(stems.values())
mix = hp(mix, 28)
win = int(0.03 * SR)
rms = np.sqrt(np.convolve((mix ** 2).mean(axis=0), np.ones(win) / win, mode='same') + 1e-12)
db = 20 * np.log10(rms)
gr = 10 ** (-np.where(db > -15.0, (db + 15.0) * 0.5, 0.0) / 20)
mix *= lfilter([0.002], [1, -0.998], gr)
mix *= np.clip((DUR - t) / 1.2, 0, 1) ** 1.5
mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.05) / np.tanh(1.05) * 0.89
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print('wrote', OUT)

if os.environ.get('ANALYZE'):
    secs = [(a, b) for a, b in C['SC'].values()]
    print('section       ' + ' '.join(f'{k:>7}' for k in stems) + '    mix')
    for a, b in secs:
        row = [20 * np.log10(np.sqrt(np.mean(v[:, S(a):S(b)] ** 2)) + 1e-9) for v in stems.values()]
        m = 20 * np.log10(np.sqrt(np.mean(mix[:, S(a):S(b)] ** 2)) + 1e-9)
        print(f'{a:5.1f}-{b:5.1f}  ' + ' '.join(f'{r:7.1f}' for r in row) + f'  {m:6.1f}')
    seg = mix.mean(axis=0)
    sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2
    fr = np.fft.rfftfreq(len(seg), 1 / SR)
    band = lambda lo, hi: 10 * np.log10(sp[(fr >= lo) & (fr < hi)].sum() + 1e-9)
    tot = band(20, 20000)
    print(f'spectrum: sub<60 {band(20,60)-tot:6.1f} low60-250 {band(60,250)-tot:6.1f} mid250-2k {band(250,2000)-tot:6.1f} pres2-6k {band(2000,6000)-tot:6.1f} air>6k {band(6000,20000)-tot:6.1f}')
