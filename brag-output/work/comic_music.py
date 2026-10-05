"""Original score + cartoon sound design for 'Level 1: your first donation' (comic films).

120 BPM in C major, one bar = 2 s. Cue times mirror comic/film.js (S, CHECK, TAPS).
Quizzes get game-show 'thinking' breaks (drums + bass drop to a ticking clock).
Usage: python3 comic_music.py [out.wav]
"""
import sys
import wave
import numpy as np
import synth as Y

SR = Y.SR
import json, os
CUES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'comic-cues.json')))
DUR = float(CUES['DUR'])
N = int(SR * DUR)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'comic-score.wav'
SC = {k: v for k, v in CUES['SC'].items()}
S = {k: v[0] for k, v in SC.items()}
T = CUES['T']
CHECK = CUES['CHECK']
GROOVE = 4.0                        # groove enters on the bar after the first panel slam
THINK = [(T['quizQ'], T['right']), (T['coinsQ'], T['coin'])]  # quiz 'thinking' breaks
music, drums, fx, rev = Y.Bus(N), Y.Bus(N), Y.Bus(N), Y.Bus(N)
kick_times = []


def thinking(t):
    return any(a <= t < b for a, b in THINK)


# ---- harmony: C  Am  F  G per bar from bar 1; bar 0 is the intro
CH = {'C': dict(root=36, uke=[60, 64, 67, 72], mel=[76, 79, None, 76, 74, 72, None, 67]),
      'Am': dict(root=33, uke=[60, 64, 69, 69], mel=[72, 76, None, 72, 71, 69, None, 64]),
      'F': dict(root=29, uke=[60, 65, 69, 69], mel=[69, 72, None, 69, 67, 65, None, 72]),
      'G': dict(root=31, uke=[62, 67, 71, 67], mel=[71, 74, None, 71, 69, 67, None, 74])}
PROG = ['C', 'Am', 'F', 'G']
bars = []
NB = int(DUR // 2) + 1
LAST = int((S['cta'] + 2.0) // 2)      # final C lands one bar into the end card
for b in range(NB):
    t0 = b * 2.0
    name = 'C' if b >= LAST else 'G' if b == LAST - 1 else PROG[b % 4]
    bars.append((t0, name))

for b, (t0, name) in enumerate(bars):
    c = CH[name]
    lift = 12 if S['coupons'] <= t0 < S['coins'] else 0   # brighter octave through coupons + pay
    for i in range(8):
        tt = t0 + i * 0.25
        if tt >= DUR - 0.05:
            break
        intro = tt < GROOVE
        think = thinking(tt)
        # marimba hook (sparse in the intro and during quizzes)
        m = c['mel'][i]
        if m is not None and not think and (not intro or i in (0, 1, 3)):
            if b >= LAST and i > 0:
                continue
            s = Y.marimba(m + lift, 0.7, 0.75 if i % 2 == 0 else 0.6)
            music.add(s, tt, pan=-0.2)
            rev.add(s, tt, 0.25)
        # ukulele offbeat 'chk' strums
        if i % 2 == 1 and tt >= GROOVE and not think and b < LAST:
            s = Y.strum(c['uke'], 0.32, 0.55, down=(i % 4 == 1))
            music.add(s, tt, pan=0.3)
        # upright bass: root on 1, fifth on 3, walk-up on the last 8th
        if tt >= GROOVE and not think and b < LAST:
            if i == 0:
                music.add(Y.upright(c['root'], 0.45, 1.0), tt)
            elif i == 4:
                music.add(Y.upright(c['root'] + 7, 0.45, 0.85), tt)
            elif i == 7:
                music.add(Y.upright(c['root'] + 5, 0.22, 0.6), tt)
        # drums
        if tt >= GROOVE and not think and b < LAST:
            if i in (0, 4):
                drums.add(Y.kick(1.0), tt); kick_times.append(tt)
            if i in (2, 6):
                s = Y.clap(0.7); drums.add(s, tt, pan=0.05); rev.add(s, tt, 0.25)
            drums.add(Y.shaker(1.5 if i % 2 else 0.8), tt, pan=-0.35)
            drums.add(Y.shaker(0.7), tt + 0.125, pan=-0.35)
        # quiz 'thinking': ticking clock + pizzicato suspense on G
        if think:
            drums.add(Y.woodblock(84 if i % 2 == 0 else 79, 0.55), tt, pan=0.25 if i % 2 else -0.25)
            if i % 2 == 0:
                music.add(Y.pizz(67 if i % 4 == 0 else 66 if False else 67, 0.35, 0.55), tt, pan=0.1)

# intro: soft pizzicato pickup + a glock 'press start' shimmer
for i, m in enumerate([60, 64, 67, 72]):
    music.add(Y.pizz(m, 0.4, 0.4), 0.1 + i * 0.12)
s = Y.sparkle((84, 88, 91, 96), 0.18); music.add(s, 0.05); rev.add(s, 0.05, 0.4)
# pickup fill into the groove at 3.0
s = Y.drumroll(0.5, 0.6); drums.add(s, GROOVE - 0.5, pan=0.1)

# final cadence: C chord with glock + uke, then tail
FIN = LAST * 2.0
for m in (60, 64, 67, 72, 76):
    s = Y.marimba(m, 1.6, 0.6); music.add(s, FIN, pan=(m - 66) / 20); rev.add(s, FIN, 0.4)
s = Y.strum([60, 64, 67, 72], 1.4, 0.8); music.add(s, FIN, pan=0.25)
music.add(Y.upright(36, 1.2, 1.0), FIN)
drums.add(Y.kick(1.0), FIN); kick_times.append(FIN)
s = Y.crash(0.7); drums.add(s, FIN, pan=-0.2); rev.add(s, FIN, 0.3)
s = Y.sparkle((96, 100, 103, 108), 0.4); fx.add(s, FIN + 0.05); rev.add(s, FIN + 0.05, 0.4)

# ---- sound design, synced to picture
def tick(t, m=84, v=0.8, pan=0.0):
    fx.add(Y.woodblock(m, v), t, pan=pan)

# hook: trunk tap shake, ticket falls (slide whistle) and lands (pop)
s = Y.brass([72, 76, 79], 0.35, 0.6); fx.add(s, 0.02); rev.add(s, 0.02, 0.3)   # 'Level 1!' lettering on frame 0
tick(T['trunk'], 79, 0.9)
fx.add(Y.pop(79, 0.8), T['trunk'])                          # 'Pop!'
fx.add(Y.boing(55, 0.5, 0.8), T['trunk'] + 0.02)
fx.add(Y.slide_whistle(84, 67, 0.45, 0.8), T['ticketDrop'], pan=0.3)
fx.add(Y.pop(72, 1.0), T['ticketLand'], pan=0.35)
fx.add(Y.boing(60, 0.35, 0.5), T['ticketLand'] + 0.01, pan=0.35)

# scene 'panel slams': swish before + soft thump on the cut
for n in ['find', 'stores', 'amount', 'coupons', 'pay', 'coins', 'track', 'goal']:
    t0 = S[n]
    fx.add(Y.swish(0.3, 0.9, up=True), t0 - 0.28, pan=0.4)
    fx.add(Y.kick(0.45), t0 + 0.05)
fx.add(Y.swish(0.45, 1.0, up=True), S['cta'] - 0.4)
fx.add(Y.slide_whistle(67, 79, 0.35, 0.5), T['hudIn'] + 0.05, pan=-0.3)   # HUD drops in

# HUD checkpoints: rising glock steps (C major scale) = the level climbing
for i, t in enumerate(CHECK):
    m = [84, 86, 88, 89, 91, 93, 95, 96][i]
    s = Y.ding(m, 0.55); fx.add(s, t, pan=0.25); rev.add(s, t, 0.35)

# find: hover Start Donating, tap the fundraiser's Donate now
fx.add(Y.pop(84, 0.4), T['door'] - 0.55, pan=0.4)
tick(T['door'], 84, 0.9, -0.2); fx.add(Y.pop(76, 0.7), T['door'] + 0.01)

# stores: tap tap tap (rising)
for t, m in [(T['walmart'], 72), (T['target'], 76), (T['amazon'], 79)]:
    fx.add(Y.pop(m, 1.0), t); tick(t, m + 12, 0.6)

# amount quiz
fx.add(Y.pop(79, 0.9), T['preset']); tick(T['preset'], 91, 0.6)
fx.add(Y.pop(84, 0.6), T['sticker'])                          # '?' sticker slaps on
fx.add(Y.bonk(0.9), T['wrong'], pan=-0.3)                      # hover on a wrong answer
fx.add(Y.pop(74, 0.4), T['right'] - 0.6, pan=0.3)               # hover C
fx.add(Y.swish(0.25, 0.8, up=True), T['right'] + 0.02)         # sticker rips off
s = Y.brass([72, 76, 79], 0.55, 1.0); fx.add(s, T['right']); rev.add(s, T['right'], 0.3)
fx.add(Y.ding(91, 0.6), T['right'] + 0.08); fx.add(Y.ding(96, 0.5), T['right'] + 0.2)
s = Y.crash(0.5); drums.add(s, T['right'], pan=-0.2)

# coupons: nine tickets deal out (pops climbing), then the stamp
for i in range(9):
    t = T['deal'] + i * 0.075 + 0.3
    fx.add(Y.pop(67 + [0, 2, 4, 5, 7, 9, 11, 12, 14][i], 0.55), t, pan=[-0.5, 0.0, 0.5][i % 3])
fx.add(Y.kick(0.9), T['stamp']); fx.add(Y.snare(0.8), T['stamp'])   # STAMP thunk
s = Y.sparkle((88, 91, 96, 100), 0.4); fx.add(s, T['stamp'] + 0.05); rev.add(s, T['stamp'] + 0.05, 0.4)

# pay: padlock clunk, click, wipe to 'Thank you for giving.'
fx.add(Y.woodblock(67, 0.8), T['lock'] + 0.2)
tick(T['pay'], 84, 1.0); fx.add(Y.pop(79, 0.8), T['pay'])
fx.add(Y.swish(0.4, 0.8, up=True), T['wipe'] - 0.03)
s = Y.sparkle((84, 88, 91, 96, 100), 0.45, step=0.06); fx.add(s, T['wipe'] + 0.25); rev.add(s, T['wipe'] + 0.25, 0.6)

# coins: 'Bonus round!' stab, fake-out bonk, ka-ching + coin cascade
s = Y.brass([79, 84, 88], 0.4, 0.9); fx.add(s, T['bonus'] + 0.05); rev.add(s, T['bonus'] + 0.05, 0.3)
fx.add(Y.bonk(0.9), T['coinWrong'], pan=-0.3)
s = Y.kaching((84, 88, 91), 1.0); fx.add(s, T['coin']); rev.add(s, T['coin'], 0.3)
for i in range(12):
    m = [100, 96, 98, 93, 95, 91, 93, 88, 91, 86, 88, 84][i]
    fx.add(Y.glock(m, 0.6, 0.35), T['coin'] + 0.08 + i * 0.06, pan=(-1) ** i * 0.5)

# track: mail whoosh, ticket hops node to node
fx.add(Y.swish(0.35, 0.8, up=True), T['mail'] - 0.05, pan=-0.5)
for i, t in enumerate(T['hops']):
    fx.add(Y.boing(55 + i * 2, 0.4, 0.55), t - 0.25)
    tick(t, [84, 86, 88, 91][i], 0.7)

# goal: you tap once, two more donors tap, then 'Fully funded' + level complete
for i, t in enumerate([T['g1'], T['g2'], T['g3']]):
    fx.add(Y.pop(72 + i * 4, 0.9), t); tick(t, 84 + i * 3, 0.6)
s = Y.brass([72, 76, 79, 84], 0.9, 1.0); fx.add(s, T['funded']); rev.add(s, T['funded'], 0.35)
s = Y.crash(0.6); drums.add(s, T['funded'])
fx.add(Y.kick(0.9), T['levelDone']); fx.add(Y.snare(0.7), T['levelDone'])
s = Y.sparkle((96, 100, 103, 108), 0.45); fx.add(s, T['levelDone'] + 0.05); rev.add(s, T['levelDone'] + 0.05, 0.5)

# CTA: 'Your turn.' stab, button, plate
s = Y.brass([67, 72, 76], 0.5, 0.8); fx.add(s, T['ctaHead']); rev.add(s, T['ctaHead'], 0.3)
fx.add(Y.pop(79, 0.7), T['ctaBtn'] + 0.05); fx.add(Y.ding(88, 0.45), T['plate'] + 0.05)

# ---- mix
t = np.arange(N) / SR
duck = np.ones(N)
for kt in kick_times:
    i0 = int(kt * SR)
    seg = np.arange(N - i0) / SR
    duck[i0:] *= 1 - 0.25 * np.exp(-seg / 0.09)
wet = Y.reverb(Y.hp(rev.x, 250), rt=1.3)
mix = music.x * duck * 0.95 + drums.x * 0.85 + fx.x * 0.9 + wet * 0.28
mix = Y.hp(mix, 30)

# gentle glue (RMS 2:1 above threshold)
from scipy.signal import lfilter
win = int(0.03 * SR)
rms = np.sqrt(np.convolve((mix ** 2).mean(axis=0), np.ones(win) / win, mode='same') + 1e-12)
db = 20 * np.log10(rms)
gr = 10 ** (-np.where(db > -15, (db + 15) * 0.5, 0) / 20)
mix *= lfilter([0.002], [1, -0.998], gr)
fade = np.clip((DUR - t) / 1.0, 0, 1) ** 1.5
mix *= fade
mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.05) / np.tanh(1.05) * 0.89

with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print('wrote', OUT)

import os
if os.environ.get('ANALYZE'):
    secs = [(0, S['find']), (S['find'], S['amount']), THINK[0], (T['right'], S['pay']), (S['pay'], S['coins']), THINK[1], (T['coin'], S['goal']), (S['goal'], S['cta']), (S['cta'], DUR)]
    stems = {'music': music.x * duck * 0.95, 'drums': drums.x * 0.85, 'fx': fx.x * 0.9, 'wet': wet * 0.28}
    print('section       ' + ' '.join(f'{k:>7}' for k in stems) + '    mix')
    for a, b in secs:
        row = [20 * np.log10(np.sqrt(np.mean(v[:, int(a * SR):int(b * SR)] ** 2)) + 1e-9) for v in stems.values()]
        m = 20 * np.log10(np.sqrt(np.mean(mix[:, int(a * SR):int(b * SR)] ** 2)) + 1e-9)
        print(f'{a:5.2f}-{b:5.2f}  ' + ' '.join(f'{r:7.1f}' for r in row) + f'  {m:6.1f}')
    seg = mix.mean(axis=0)
    sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2
    fr = np.fft.rfftfreq(len(seg), 1 / SR)
    band = lambda lo, hi: 10 * np.log10(sp[(fr >= lo) & (fr < hi)].sum() + 1e-9)
    tot = band(20, 20000)
    print(f'spectrum: sub<60 {band(20,60)-tot:6.1f} low60-250 {band(60,250)-tot:6.1f} mid250-2k {band(250,2000)-tot:6.1f} pres2-6k {band(2000,6000)-tot:6.1f} air>6k {band(6000,20000)-tot:6.1f}')
