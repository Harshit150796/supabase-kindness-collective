# Sound design for 'Co-op mode', exec'd by comic_music.py (FILM=coop) with its globals:
# Y (synth), fx/drums/rev/music buses, S/SC/T from coop-cues.json, tick().
TURN = CUES['TURN']

# frame 0: 'Co-op mode!' lettering, both players pop in
s = Y.brass([72, 76, 79], 0.35, 0.6); fx.add(s, 0.02); rev.add(s, 0.02, 0.3)
fx.add(Y.pop(72, 0.9), max(0.02, T['p1In'] + 0.25), pan=-0.35)
fx.add(Y.pop(79, 0.9), max(0.1, T['p2In'] + 0.25), pan=0.35)
fx.add(Y.boing(60, 0.35, 0.45), 0.3, pan=-0.35)

# panel slams between scenes
for n in ['apply', 'share', 'give', 'arrive', 'update', 'goal']:
    t0 = S[n]
    fx.add(Y.swish(0.3, 0.9, up=True), t0 - 0.28, pan=0.4)
    fx.add(Y.kick(0.45), t0 + 0.05)
fx.add(Y.swish(0.45, 1.0, up=True), S['cta'] - 0.4)
fx.add(Y.slide_whistle(67, 79, 0.35, 0.5), T['tabsIn'] + 0.05, pan=-0.3)   # player tabs drop in

# whose turn: Player 1 = low two-note, Player 2 = high two-note, both = chord
for tt, who in TURN:
    if who == 3:
        for m in (84, 88, 91):
            s = Y.ding(m, 0.4); fx.add(s, tt + 0.1); rev.add(s, tt + 0.1, 0.3)
    else:
        a, b = (79, 84) if who == 1 else (86, 91)
        fx.add(Y.ding(a, 0.45), tt + 0.08, pan=-0.3 if who == 1 else 0.3); fx.add(Y.ding(b, 0.45), tt + 0.2, pan=-0.3 if who == 1 else 0.3)

# Player 1 applies: taps, step changes, cover photo, submit, 'Great work!'
fx.add(Y.pop(76, 0.9), T['tapFamily']); tick(T['tapFamily'], 88, 0.6)
fx.add(Y.pop(79, 0.9), T['tapFood']); tick(T['tapFood'], 91, 0.6)
for t in (T['next1'], T['next2'], T['next3']):
    tick(t, 84, 0.8); fx.add(Y.swish(0.22, 0.55, up=True), t + 0.15, pan=0.3)
fx.add(Y.pop(84, 0.8), T['cover']); s = Y.sparkle((88, 91, 96), 0.3); fx.add(s, T['cover'] + 0.05); rev.add(s, T['cover'] + 0.05, 0.4)
fx.add(Y.pop(81, 0.9), T['chip']); tick(T['chip'], 93, 0.6)
tick(T['submit'], 84, 1.0); fx.add(Y.pop(79, 0.9), T['submit'])
s = Y.brass([72, 76, 79, 84], 0.7, 1.0); fx.add(s, T['great']); rev.add(s, T['great'], 0.35)
s = Y.crash(0.5); drums.add(s, T['great'], pan=-0.2)
s = Y.sparkle((88, 91, 96, 100), 0.4); fx.add(s, T['great'] + 0.1); rev.add(s, T['great'] + 0.1, 0.5)

# share: tap, 'Link copied!'
tick(T['shareTap'], 84, 0.9); fx.add(Y.pop(79, 0.8), T['shareTap'])
fx.add(Y.ding(91, 0.5), T['shareTap'] + 0.15)

# Player 2 gives: Donate now, three coupons deal out, 'Coupons, not cash' stamp
tick(T['donateTap'], 84, 1.0); fx.add(Y.pop(76, 0.8), T['donateTap'])
for i in range(3):
    t = T['deal'] + i * 0.12 + 0.3
    fx.add(Y.pop(72 + [0, 4, 7][i], 0.7), t, pan=[-0.5, 0.0, 0.5][i])
fx.add(Y.kick(0.9), T['notCash']); fx.add(Y.snare(0.8), T['notCash'])
s = Y.sparkle((88, 91, 96, 100), 0.35); fx.add(s, T['notCash'] + 0.05); rev.add(s, T['notCash'] + 0.05, 0.4)

# Player 1: email arrives, Reveal code, Used, Mark as used, toast
fx.add(Y.swish(0.35, 0.8, up=True), T['mail'] - 0.05, pan=-0.5)
tick(T['reveal'], 86, 0.9); fx.add(Y.pop(79, 0.8), T['reveal'])
s = Y.sparkle((84, 88, 91, 96), 0.35, step=0.05); fx.add(s, T['reveal'] + 0.08); rev.add(s, T['reveal'] + 0.08, 0.5)
tick(T['usedTap'], 84, 0.8); fx.add(Y.pop(76, 0.7), T['usedTap'])
fx.add(Y.swish(0.25, 0.6, up=True), T['dialog'] - 0.05, pan=0.4)
tick(T['markTap'], 88, 0.9); fx.add(Y.pop(81, 0.8), T['markTap'])
fx.add(Y.ding(88, 0.55), T['toast']); fx.add(Y.ding(93, 0.5), T['toast'] + 0.12)

# Player 2: the update lands, Received then Used light up
fx.add(Y.swish(0.35, 0.8, up=True), T['updMail'] - 0.05, pan=-0.5)
s = Y.ding(88, 0.6); fx.add(s, T['recv']); rev.add(s, T['recv'], 0.3)
s = Y.ding(93, 0.6); fx.add(s, T['used']); rev.add(s, T['used'], 0.3)
s = Y.sparkle((91, 96, 100), 0.3); fx.add(s, T['used'] + 0.08); rev.add(s, T['used'] + 0.08, 0.4)

# together: three donors fill the goal, 'Fully funded!', 'Co-op complete!'
for i, t in enumerate([T['g1'], T['g2'], T['g3']]):
    fx.add(Y.pop(72 + i * 4, 0.9), t); tick(t, 84 + i * 3, 0.6)
s = Y.brass([72, 76, 79, 84], 0.9, 1.0); fx.add(s, T['funded']); rev.add(s, T['funded'], 0.35)
s = Y.crash(0.6); drums.add(s, T['funded'])
fx.add(Y.kick(0.9), T['done']); fx.add(Y.snare(0.7), T['done'])
s = Y.sparkle((96, 100, 103, 108), 0.45); fx.add(s, T['done'] + 0.05); rev.add(s, T['done'] + 0.05, 0.5)

# CTA: headline stab, both buttons, plate
s = Y.brass([67, 72, 76], 0.5, 0.8); fx.add(s, T['ctaHead']); rev.add(s, T['ctaHead'], 0.3)
fx.add(Y.pop(79, 0.7), T['ctaBtns'] + 0.05); fx.add(Y.pop(84, 0.7), T['ctaBtns'] + 0.2)
fx.add(Y.ding(88, 0.45), T['plate'] + 0.05)
