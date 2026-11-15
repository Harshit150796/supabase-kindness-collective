"""Original score + sound design for "Hope vs. Know" (vertical chat video for coupondonation.com).

D major, 120 BPM (beat 0.5 s, bar 2 s). The score tells the film's idea: HOPE is unresolved (a dark pad, a ticking clock,
sparse piano questions on suspended chords, a heartbeat under the scam stories) and KNOW arrives as light: at the first product
screen the groove switches on, the arpeggios brighten, and "You'll know." lands on a resolved D chord with bells. "Oof." and
"You'll know." each get a beat of near-silence before the next cut. Sound effects (bubble pops, finger taps, numeral fills,
whooshes, the ticket hopping along the trail) share the key, the beat grid and the reverb. Picture cues come from cues-<cut>.json.
Usage: CUT=full|short python3 music.py [out.wav]   (ANALYZE=1 prints a per-section table)
"""
import os, sys, json, wave
CUT = os.environ.get('CUT', 'full')
HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, f'cues-{CUT}.json')))
os.environ['DUR'] = str(C['dur'])
import numpy as np
from scipy.signal import lfilter, fftconvolve
from inst import *  # noqa: F401,F403  (SR, DUR, N, S, Bus, piano, mallet, bell, supersaw_chord, bass_note, kick, clap, hat, shaker, crash, riser, whoosh, boom, paper, click, lp, hp, rng)

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, f'score-{CUT}.wav')
BAR, BEAT = 2.0, 0.5

CH = {'D': ([50, 57, 62, 66, 69], 38), 'A': ([49, 57, 61, 64, 69], 33), 'Bm': ([47, 54, 59, 62, 66], 35),
      'G': ([43, 50, 55, 59, 62, 69], 31), 'Asus': ([45, 52, 57, 62, 64], 33)}
ARP = {'D': [74, 78, 81, 86], 'A': [73, 76, 81, 85], 'Bm': [71, 74, 78, 83], 'G': [71, 74, 79, 83], 'Asus': [74, 76, 81, 86]}
SC_Q = [74, 78, 81, 83]  # the hope motif: a question that never resolves (D F# A B)

# per-cut form: chords per 2 s bar; light = when the groove switches on (a pick-up beat before the first product screen);
# brk = the hope/know plate (drums thin out); resolve = "You'll know."; holes = beats of near-silence; pulse = heartbeat window
FORM = {
    'full': dict(
        prog='Bm G Asus  Bm G D Asus Bm G  Asus Bm G Asus  Bm G Bm Asus Asus  D A Bm G D A  G A D D D D'.split(),
        light=35.5, brk=48.5, resolve=50.95, holes=[(17.85, 18.4), (51.9, 52.4)], pulse=[(6.0, 26.5)], riser=(34.0, 35.5), end=52.5),
    'short': dict(
        prog='Bm G Asus  Bm G Asus  D A Bm G D A  G A D D D'.split(),
        light=13.0, brk=23.2, resolve=25.0, holes=[(10.7, 11.2), (25.95, 26.45)], pulse=[(5.2, 12.7)], riser=(11.7, 13.0), end=27.0),
}[CUT]
PROG = FORM['prog']
assert len(PROG) * BAR >= C['dur'] - 0.01, (len(PROG), C['dur'])
LIGHT, BRK, RES = FORM['light'], FORM['brk'], FORM['resolve']
cues = C['cues']
tcue = lambda kind: [c['t'] for c in cues if c['kind'] == kind]

pad, keys, bass, drums, fx, rev = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()
kicks = []
mode = lambda t: 'hope' if t < LIGHT else 'groove' if t < BRK else 'sparse' if t < RES else 'resolve'

# ---- pad: dark and closed while we hope; wide and bright once we know
for b, name in enumerate(PROG):
    t0 = b * BAR
    if t0 >= C['dur']:
        break
    ch, root = CH[name]
    m = mode(t0 + 0.9)
    last = t0 >= C['dur'] - BAR
    dur = BAR + (0.5 if not last else C['dur'] - t0)
    if m == 'hope':
        sig = supersaw_chord(ch, dur, lambda s: 420 + 700 * np.clip(s / BAR, 0, 1), a=0.7, r=0.9, gain=0.5)
    elif m == 'groove':
        sig = supersaw_chord(ch, dur, 3600, a=0.18, r=0.8, gain=0.9)
    elif m == 'sparse':
        sig = supersaw_chord(ch, dur, 1800, a=0.4, r=1.0, gain=0.7)
    else:
        sig = supersaw_chord(ch + [ch[2] + 12], dur, lambda s: 2400 + 3000 * np.clip(s / 2.0, 0, 1), a=0.1, r=1.6, gain=1.15)
    pad.add(sig, t0, gain=1.5)
    rev.add(sig, t0, gain=0.5)
# the resolution: a D chord blooms exactly when "You'll know." lands
d_ch = CH['D'][0] + [86]
res_pad = supersaw_chord(d_ch, C['dur'] - RES + 0.2, lambda s: 1500 + 4200 * np.clip(s / 1.2, 0, 1), a=0.12, r=2.0, gain=1.25)
pad.add(res_pad, RES, gain=1.4); rev.add(res_pad, RES, gain=0.6)

# ---- piano: hope = a sparse question; know = bright arpeggios
for b, name in enumerate(PROG):
    t0 = b * BAR
    if t0 >= C['dur']:
        break
    m = mode(t0 + 0.9)
    arp = ARP[name]
    if m == 'hope':
        for beat, idx, v in [(0, 0, 0.42), (1.5, 2, 0.3), (2.5, 3, 0.26)]:
            tt = t0 + beat * BEAT * 2
            if tt >= RES or (tt >= LIGHT):
                continue
            s = piano(arp[idx], 3.0, vel=v, bright=0.78); keys.add(s, tt, pan=-0.15); rev.add(s, tt, 0.7)
    elif m == 'groove':
        pat = [0, 1, 2, 3, 1, 2, 3, 2, 0, 1, 2, 3, 1, 2, 3, 1]
        for i in range(16):
            tt = t0 + i * 0.125
            if tt < LIGHT:
                continue
            mm = arp[pat[i]] + (12 if (t0 > LIGHT + 8 and i % 8 >= 4) else 0)
            s = piano(mm, 1.2, vel=(0.55 if i % 4 == 0 else 0.38) * 0.8, bright=0.88)
            keys.add(s, tt, pan=-0.35 + 0.7 * pat[i] / 3); rev.add(s, tt, 0.4)
    elif m == 'sparse':
        for beat, idx in [(0, 2), (2, 3)]:
            tt = t0 + beat * BEAT
            if tt >= RES:
                continue
            s = piano(arp[idx], 2.4, vel=0.4, bright=0.8); keys.add(s, tt); rev.add(s, tt, 0.6)
# the closing phrase: a warm D major run that lands on D6 with the last chord
for i, mm in enumerate([74, 78, 81, 86]):
    tt = RES + 0.05 + i * 0.09
    s = piano(mm, 3.4, vel=0.55, bright=0.85); keys.add(s, tt, pan=-0.1 + 0.07 * i); rev.add(s, tt, 0.7)
for tt, mm, v in [(RES + 1.6, 90, 0.4), (RES + 2.2, 86, 0.34), (RES + 2.8, 81, 0.3)]:
    if tt < C['dur'] - 0.4:
        s = piano(mm, 2.6, vel=v, bright=0.85); keys.add(s, tt, pan=0.1); rev.add(s, tt, 0.7)

# ---- bass: a held drone while we hope; 8ths once the groove is on; the root of D at the end
for b, name in enumerate(PROG):
    t0 = b * BAR
    if t0 >= C['dur']:
        break
    ch, root = CH[name]
    m = mode(t0 + 0.9)
    if t0 < BAR * 3:
        if b == 0:
            bass.add(bass_note(38, 5.5, 0.4), 0.0)
        continue
    if m in ('hope', 'sparse'):
        bass.add(bass_note(root, BAR - 0.05, 0.5), t0)
    elif m == 'groove':
        for i in range(8):
            tt = t0 + i * 0.25
            if tt < LIGHT - 0.01:
                continue
            bass.add(bass_note(root + (12 if i % 4 == 3 else 0), 0.22, 0.95 if i % 2 == 0 else 0.72), tt)
bass.add(bass_note(38, C['dur'] - RES, 0.75), RES)

# ---- drums: a heartbeat under the stories, then the groove, then nothing but the final kick
for a, b in FORM['pulse']:
    for tt in np.arange(a, b, 1.0):
        drums.add(kick(0.42), tt); kicks.append(tt)
        drums.add(hat(0.25), tt + 0.5, pan=0.3)
t = LIGHT
while t < BRK - 1e-6:
    beat = int(round((t - LIGHT) / BEAT)) % 4
    drums.add(kick(1.0), t); kicks.append(t)
    if beat in (1, 3):
        c = clap(0.9); drums.add(c, t, pan=0.05); rev.add(c, t, 0.3)
    drums.add(hat(0.8), t + 0.25, pan=0.3)
    for i in range(4):
        drums.add(shaker(1.0 if i % 2 else 0.55), t + i * 0.125, pan=-0.35)
    t += BEAT
for tt in np.arange(BRK, RES - 1e-6, 1.0):          # hope/know plate: the heartbeat again, then it stops
    drums.add(kick(0.55), tt); kicks.append(tt)
a, b = FORM['riser']
fx.add(riser(b - a + 0.1), a, gain=0.7); rev.add(riser(b - a + 0.1), a, 0.3)
for tt, v in [(LIGHT, 0.9), (RES, 1.0)]:
    cr = crash(v); drums.add(cr, tt, pan=-0.2); rev.add(cr, tt, 0.3)
drums.add(kick(1.0), RES); kicks.append(RES)

# ---- sound design, timed to the picture
def tick(tt, m, v=0.8, pan=0.15):
    fx.add(click(m, v), tt, pan=pan)
    s = mallet(m + 12, 0.6, 0.16 * v); fx.add(s, tt, pan=pan); rev.add(s, tt, 0.4)

def swoosh(tt, dur=0.5, f1=300, f2=4200, v=0.6, pan=0.0):
    w = whoosh(dur, f1, f2, v); fx.add(w, tt - dur / 2, pan=pan); rev.add(w, tt - dur / 2, 0.3)

def pop(tt, mm=93, v=0.7, pan=0.3):                 # two-note chat pop (a bubble opening)
    for dt, m2, g in [(0.0, mm, 0.2), (0.05, mm + 7, 0.14)]:
        s = mallet(m2, 0.4, g * v); fx.add(s, tt + dt, pan=pan); rev.add(s, tt + dt, 0.35)

# plate cuts: a whoosh on every wipe
for p in C['plates'][1:]:
    swoosh(p['t0'], 0.45, 280, 4200, 0.45 if p['type'] not in ('stores', 'amount', 'review') else 0.3, 0.0)
# bubbles: the viewer's phone is lower and rounder, Coupon's is brighter
for c in cues:
    if c['kind'] == 'line':
        if c['who'] == 'you':
            pop(c['t'] + 0.02, 79, 0.5, -0.45)
        else:
            pop(c['t'] + 0.02, 88, 0.55, 0.45)
# numerals: a riser as they fill, a bell as they land
for tt in tcue('fill'):
    fx.add(riser(0.9), tt, gain=0.4)
    s = bell(86, 2.4, 0.3); fx.add(s, tt + 0.95); rev.add(s, tt + 0.95, 0.6)
    fx.add(boom(0.35), tt + 0.95)
# finger taps on the screens
for tt in tcue('tap'):
    tick(tt, 83, 0.7, 0.1)
for tt in tcue('success'):                           # "Payment successful": a chime that goes nowhere
    s = bell(93, 2.0, 0.22); fx.add(s, tt + 0.2); rev.add(s, tt + 0.2, 0.7)
    s = bell(98, 2.0, 0.16); fx.add(s, tt + 0.35); rev.add(s, tt + 0.35, 0.7)
for tt in tcue('oof'):                               # the thud of an "Oof."
    fx.add(boom(0.5), tt); b2 = whoosh(0.35, 1800, 200, 0.5); fx.add(b2, tt - 0.1)
for tt in tcue('enter'):
    pop(tt + 0.3, 93, 0.9, 0.5)
for tt in tcue('receipt'):                           # the phone's screen finally changes
    for i, m2 in enumerate([81, 85, 88, 93, 97]):
        s = mallet(m2, 1.0, 0.34); fx.add(s, tt + i * 0.07, pan=-0.4 + 0.15 * i); rev.add(s, tt + i * 0.07, 0.6)
for i, tt in enumerate(tcue('step')):                # the ticket hops along the trail
    s = mallet([81, 85, 88, 93][i % 4], 1.0, 0.4); fx.add(s, tt, pan=-0.3 + 0.2 * i); rev.add(s, tt, 0.5)
    fx.add(paper(0.4), tt - 0.02, pan=-0.3 + 0.2 * i)
for tt in tcue('strike'):
    fx.add(paper(0.7), tt); tick(tt + 0.25, 74, 0.8, 0.0)
for tt in tcue('know'):                              # "You'll know.": bells on the resolved chord
    for m2 in (74, 78, 81, 86):
        s = bell(m2, 5.0, 0.42); fx.add(s, tt + 0.02, pan=(m2 - 80) / 14); rev.add(s, tt + 0.02, 0.8)
    fx.add(boom(0.7), tt)
for tt in tcue('end'):                               # the end card: a sparkle and the logo's sting
    for i, m2 in enumerate([93, 98, 102]):
        s = mallet(m2, 1.2, 0.3); fx.add(s, tt + i * 0.1, pan=0.2 - 0.2 * i); rev.add(s, tt + i * 0.1, 0.6)
    s = bell(90, 3.2, 0.3); fx.add(s, tt + 0.5); rev.add(s, tt + 0.5, 0.7)

# a clock that ticks while we hope: one soft tick per beat until the product screens arrive (it stops dead at the light)
for tt in np.arange(0.5, LIGHT - 0.01, BEAT):
    if any(a <= tt < b for a, b in FORM['holes']):
        continue
    fx.add(click(95, 0.1 if int(tt / BEAT) % 2 else 0.16), tt, pan=0.5 if int(tt / BEAT) % 2 else -0.5)

# ------------------------------------------------------------------ mix
t = np.arange(N) / SR
duck = np.ones(N)
for kt in kicks:
    i0 = S(kt)
    if i0 < N:
        seg = np.arange(N - i0) / SR
        duck[i0:] *= 1 - 0.45 * np.exp(-seg / 0.11)
ir_n = int(2.8 * SR); ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal((2, ir_n)) * np.exp(-ir_t / 0.6)
ir[:, :int(0.02 * SR)] = 0
ir = lp(ir, 6500)
ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
send = hp(rev.x, 220)
wet = np.vstack([fftconvolve(send[0], ir[0])[:N], fftconvolve(send[1], ir[1])[:N]])
stems = {'pad': pad.x * duck * 0.9, 'bass': bass.x * duck, 'keys': keys.x * 0.95, 'drums': drums.x * 0.85, 'fx': fx.x * 0.95, 'wet': wet * 0.3}
mix = sum(stems.values())
mix = hp(mix, 28)
# glue
win = int(0.03 * SR)
rms = np.sqrt(np.convolve((mix ** 2).mean(axis=0), np.ones(win) / win, mode='same') + 1e-12)
db = 20 * np.log10(rms)
gr = 10 ** (-np.where(db > -15.0, (db + 15.0) * 0.5, 0.0) / 20)
mix *= lfilter([0.002], [1, -0.998], gr)
# beats of near-silence: everything drops out for "Oof." and "You'll know.", then returns
hole = np.ones(N)
for a, b in FORM['holes']:
    ia, ib = S(a), S(b)
    ramp_in, ramp_out = int(0.03 * SR), int(0.12 * SR)
    hole[max(0, ia - ramp_in):ia] = np.linspace(1, 0.04, ia - max(0, ia - ramp_in)) if ia > 0 else 1
    hole[ia:ib] = 0.04
    hole[ib:min(N, ib + ramp_out)] = np.linspace(0.04, 1, min(N, ib + ramp_out) - ib)
mix *= hole
mix *= np.clip((DUR - t) / 1.2, 0, 1) ** 1.5
mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.05) / np.tanh(1.05) * 0.89
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print('wrote', OUT)

if os.environ.get('ANALYZE'):
    print('section       ' + ' '.join(f'{k:>7}' for k in stems) + '    mix')
    for p in C['plates']:
        a, b = p['t0'], p['t1']
        row = [20 * np.log10(np.sqrt(np.mean(v[:, S(a):S(b)] ** 2)) + 1e-9) for v in stems.values()]
        m = 20 * np.log10(np.sqrt(np.mean(mix[:, S(a):S(b)] ** 2)) + 1e-9)
        print(f'{a:5.1f}-{b:5.1f} {p["type"][:6]:6s} ' + ' '.join(f'{r:7.1f}' for r in row) + f'  {m:6.1f}')
