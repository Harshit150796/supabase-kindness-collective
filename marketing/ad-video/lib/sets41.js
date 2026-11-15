/* Sets for "Day 41": a car lived in, a gas-station bathroom, the school drop-off, a parking lot, the apply flow.
   Loaded after sets.js. Floor line is y = 0 unless noted; people sitting in the car are placed a little lower. */
(function () {
  'use strict';
  const CD = window.CD;
  const { el } = CD;
  const S = CD.sets;
  const rect = (g, x, y, w, h, fill, extra = {}) => el('rect', { x, y, width: w, height: h, fill, ...extra }, g);
  const SKY = { dawn: ['#41597c', '#c3d6e6'], night: ['#0a121d', '#172739'], dusk: ['#1b2a45', '#7389ab'], day: ['#b9d8ee', '#e9f3fa'], evening: ['#27375a', '#b9c3dc'] };
  const text = (g, x, y, str, size, o = {}) => {
    const t = el('text', { x, y, 'font-family': o.font || 'IN', 'font-size': size, 'font-weight': o.w || 600, fill: o.fill || '#fff', 'text-anchor': o.anchor || 'middle', 'letter-spacing': o.ls || 0 }, g);
    t.textContent = str;
    return t;
  };

  /** A colour wash over everything drawn so far (multiply), for dawn, dusk and night. */
  S.tint = (g, color, opacity = 1) => rect(g, -5000, -4000, 10000, 8000, color, { style: 'mix-blend-mode:multiply', opacity });
  /** A soft light (screen), e.g. a phone lighting a face. */
  S.glow = (g, x, y, rx, ry, a = 0.5, color = '#dcecff') => el('ellipse', { cx: x, cy: y, rx, ry, fill: CD.rgrad([[0, color, a], [1, color, 0]]), style: 'mix-blend-mode:screen' }, g);

  // ------------------------------------------------------------------ car, seen from the dashboard
  S.carFront = function (g, o = {}) {
    const night = o.time === 'night';
    const sky = SKY[o.time || 'dawn'];
    rect(g, -5000, -4000, 10000, 8000, '#1c262c');
    rect(g, -5000, -4000, 10000, 3330, '#26323a');
    const glass = (pts) => { el('polygon', { points: pts, fill: CD.vgrad(sky[0], sky[1]) }, g); el('polygon', { points: pts, fill: '#ffffff', opacity: night ? 0.04 : 0.18 }, g); };
    glass('-340,-650 340,-650 380,-430 -380,-430');
    glass('-980,-660 -470,-640 -450,-420 -1040,-380');
    glass('980,-660 470,-640 450,-420 1040,-380');
    glass('-2400,-780 -1100,-680 -1150,-340 -2400,-180');
    glass('2400,-780 1100,-680 1150,-340 2400,-180');
    if (night) for (const [x, y, r] of [[-210, -560, 22], [160, -590, 15], [-760, -540, 20], [800, -520, 22], [-1600, -520, 30], [1700, -480, 34]]) {
      el('circle', { cx: x, cy: y, r: r * 3.2, fill: CD.rgrad([[0, '#dfeaf5', 0.35], [1, '#dfeaf5', 0]]) }, g);
      el('circle', { cx: x, cy: y, r, fill: '#eaf2fa', opacity: 0.75 }, g);
    }
    rect(g, -470, -440, 940, 340, '#303e46', { rx: 30 });
    rect(g, -270, -500, 150, 80, '#303e46', { rx: 20 });
    rect(g, 120, -500, 150, 80, '#303e46', { rx: 20 });
    if (o.lump) el('path', { d: 'M -440 -250 Q -330 -372 -190 -346 Q -150 -338 -150 -250 Z', fill: '#2a6b30' }, g);
    const seat = (x) => {
      rect(g, x - 118, -520, 236, 760, CD.vgrad('#44545d', '#35434b'), { rx: 44 });
      rect(g, x - 7, -530, 14, 30, '#2a353b');
      rect(g, x - 64, -622, 128, 96, '#3d4c55', { rx: 28 });
    };
    seat(-330);
    seat(0);
  };
  /** Dashboard edge in front of the driver, plus the light of the hour. Draw after the people. */
  S.carDash = function (g, o = {}) {
    el('path', { d: 'M -2600 -150 Q -1200 -215 0 -200 Q 1200 -215 2600 -150 L 2600 1600 L -2600 1600 Z', fill: '#11181c' }, g);
    el('path', { d: 'M -2600 -150 Q -1200 -215 0 -200 Q 1200 -215 2600 -150', fill: 'none', stroke: '#2b383f', 'stroke-width': 6 }, g);
    if (o.wash === false) return;
    if (o.time === 'night') { S.tint(g, '#6a7aa6'); rect(g, -5000, -4000, 10000, 8000, '#070d18', { opacity: 0.14 }); }
    else S.tint(g, '#a8bcd9', 0.55);
  };

  // ------------------------------------------------------------------ back seat, seen from between the front seats
  S.carBack = function (g) {
    const sky = SKY.dawn;
    rect(g, -5000, -4000, 10000, 8000, '#1c262c');
    rect(g, -5000, -4000, 10000, 3280, '#26323a');
    const win = '-560,-720 560,-720 640,-450 -640,-450';
    el('polygon', { points: win, fill: CD.vgrad(sky[0], sky[1]) }, g);
    el('polygon', { points: win, fill: '#fff', opacity: 0.22 }, g);
    for (const s of [-1, 1]) {
      const pts = `${s * 760},-700 ${s * 1700},-780 ${s * 1700},-300 ${s * 800},-420`;
      el('polygon', { points: pts, fill: CD.vgrad(sky[0], sky[1]) }, g);
      el('polygon', { points: pts, fill: '#fff', opacity: 0.3 }, g);
    }
    // a smiley someone small drew in the fogged rear window
    const sm = el('g', { fill: 'none', stroke: '#41597c', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.6 }, g);
    el('circle', { cx: 250, cy: -590, r: 62 }, sm);
    el('path', { d: 'M 218 -576 Q 250 -540 282 -576' }, sm);
    el('line', { x1: 230, y1: -612, x2: 230, y2: -604 }, sm);
    el('line', { x1: 270, y1: -612, x2: 270, y2: -604 }, sm);
    rect(g, -640, -452, 1280, 26, '#2a363d');
    // a clean school shirt on a hanger
    const sh = el('g', { transform: 'translate(120 0)' }, g);
    el('path', { d: 'M 470 -704 q 0 -22 16 -22 q 16 0 16 18', fill: 'none', stroke: '#9aa6ad', 'stroke-width': 5 }, sh);
    el('path', { d: 'M 394 -656 L 486 -702 L 578 -656 L 566 -452 L 406 -452 Z', fill: '#f2f5f7' }, sh);
    el('path', { d: 'M 468 -692 L 486 -664 L 504 -692', fill: 'none', stroke: '#c9d3d9', 'stroke-width': 4 }, sh);
    el('line', { x1: 486, y1: -664, x2: 486, y2: -452, stroke: '#d5dde2', 'stroke-width': 3 }, sh);
    // seat
    rect(g, -780, -440, 1560, 300, CD.vgrad('#44545d', '#394850'), { rx: 36 });
    rect(g, -340, -500, 180, 90, '#3d4c55', { rx: 24 });
    rect(g, 160, -500, 180, 90, '#3d4c55', { rx: 24 });
    rect(g, -810, -190, 1620, 170, '#33424a', { rx: 30 });
    el('line', { x1: 0, y1: -430, x2: 0, y2: -40, stroke: '#2a363d', 'stroke-width': 5 }, g);
  };
  /** Front-seat backs that frame the back-seat view, and the dawn wash. Draw last. */
  S.carBackFront = function (g) {
    rect(g, -1900, -660, 820, 2400, CD.vgrad('#39474f', '#262f35'), { rx: 70 });
    rect(g, 1080, -660, 820, 2400, CD.vgrad('#39474f', '#262f35'), { rx: 70 });
    rect(g, -260, -40, 520, 1800, '#1a2227', { rx: 30 });
    S.tint(g, '#a8bcd9', 0.6);
  };

  // ------------------------------------------------------------------ gas-station bathroom (we are the mirror)
  S.bathroom = function (g) {
    rect(g, -5000, -4000, 10000, 8000, '#dde6e4');
    for (let x = -2200; x <= 2200; x += 110) rect(g, x, -4000, 3, 4000, '#c7d3d1');
    for (let y = -1650; y <= 0; y += 110) rect(g, -5000, y, 10000, 3, '#c7d3d1');
    rect(g, -5000, -790, 10000, 110, '#6f9c94');
    for (let x = -2200; x <= 2200; x += 110) rect(g, x, -790, 3, 110, '#5f8b83');
    rect(g, -360, -1010, 720, 34, '#ffffff', { rx: 17 });
    el('ellipse', { cx: 0, cy: -900, rx: 900, ry: 320, fill: CD.rgrad([[0, '#ffffff', 0.5], [1, '#ffffff', 0]]) }, g);
    rect(g, 430, -600, 170, 150, '#eef2f3', { rx: 22 });
    rect(g, 480, -470, 70, 30, '#c3ccd0', { rx: 10 });
    el('circle', { cx: 515, cy: -540, r: 16, fill: '#c3ccd0' }, g);
    rect(g, -640, -640, 180, 200, '#4a5b6c', { rx: 14 });
    rect(g, -600, -450, 100, 40, '#f4f6f5');
    rect(g, -1560, -940, 520, 940, '#b8c7c4');
    el('circle', { cx: -1100, cy: -450, r: 16, fill: '#8d9aa2' }, g);
  };
  S.sink = function (g) {
    rect(g, -2600, -208, 5200, 22, '#f1f4f3', { rx: 4 });
    rect(g, -2600, -188, 5200, 1600, CD.vgrad('#b7c6c3', '#9fb1ad'));
    el('ellipse', { cx: -330, cy: -200, rx: 190, ry: 16, fill: '#d5dedc' }, g);
    el('path', { d: 'M -330 -206 L -330 -300 Q -330 -340 -280 -340 L -250 -340 L -250 -322', fill: 'none', stroke: '#aab6bc', 'stroke-width': 18, 'stroke-linecap': 'round' }, g);
    rect(g, 250, -280, 50, 74, '#6f9c94', { rx: 10 });
    rect(g, 266, -306, 18, 28, '#4d7a72', { rx: 4 });
    rect(g, 262, -312, 40, 9, '#4d7a72', { rx: 4 });
    rect(g, 400, -332, 8, 92, '#2e7d32', { rx: 4, transform: 'rotate(-10 404 -250)' });
    rect(g, 426, -338, 8, 98, '#1565c0', { rx: 4, transform: 'rotate(9 430 -250)' });
    rect(g, 384, -272, 70, 66, '#eef2f4', { rx: 8 });
    S.tint(g, '#dfe9ee', 0.5);
  };

  // ------------------------------------------------------------------ through the windshield
  S.windshieldOut = function (g) {
    const w = el('g', { transform: 'translate(0 -240) scale(0.62)' }, g);
    S.street(w);
    return w;
  };
  S.windshieldIn = function (g) {
    el('path', { 'fill-rule': 'evenodd', fill: '#141b1f', d: 'M -3000 -2600 L 3000 -2600 L 3000 2000 L -3000 2000 Z M -760 -820 L 760 -820 Q 860 -820 880 -720 L 980 -250 Q 0 -300 -980 -250 L -880 -720 Q -860 -820 -760 -820 Z' }, g);
    el('polygon', { points: '-500,-820 -200,-820 -700,-250 -980,-250', fill: '#ffffff', opacity: 0.05 }, g);
    rect(g, -150, -806, 300, 84, '#0e1417', { rx: 22 });
    rect(g, -134, -796, 268, 60, '#3b4a55', { rx: 16 });
    el('path', { d: 'M -980 -250 Q 0 -300 980 -250', fill: 'none', stroke: '#2b383f', 'stroke-width': 8 }, g);
    for (let i = 0; i < 5; i++) rect(g, -80 + i * 36, -222, 22, 60, '#0c1114', { rx: 6 });
    el('circle', { cx: -430, cy: 170, r: 360, fill: 'none', stroke: '#0a0f12', 'stroke-width': 56 }, g);
    el('circle', { cx: -430, cy: 170, r: 360, fill: 'none', stroke: '#1d272d', 'stroke-width': 8 }, g);
  };

  // ------------------------------------------------------------------ steering wheel, fuel gauge, the last eleven dollars
  S.wheel = function (g, o) {
    const skin = o.skin, skinS = CD.shade(skin, -0.16), sleeve = o.sleeve;
    rect(g, -5000, -4000, 10000, 8000, '#12191d');
    el('path', { d: 'M -600 -330 Q 0 -590 600 -330 L 600 -110 L -600 -110 Z', fill: '#090d10' }, g);
    for (const cx of [-265, 265]) {
      el('path', { d: `M ${cx - 140} -180 A 140 140 0 0 1 ${cx + 140} -180`, fill: 'none', stroke: '#33424c', 'stroke-width': 10 }, g);
      for (let i = 0; i <= 6; i++) { const a = Math.PI + (i / 6) * Math.PI; el('line', { x1: cx + Math.cos(a) * 140, y1: -180 + Math.sin(a) * 140, x2: cx + Math.cos(a) * 118, y2: -180 + Math.sin(a) * 118, stroke: '#7b8b99', 'stroke-width': 5 }, g); }
    }
    text(g, 148, -150, 'E', 38, { w: 760 });
    text(g, 384, -150, 'F', 38, { w: 760, fill: '#7b8b99' });
    // fuel pump mark
    const pump = el('g', { transform: 'translate(265 -262)', fill: 'none', stroke: '#dfe7ec', 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    el('rect', { x: -16, y: -20, width: 24, height: 40, rx: 3 }, pump);
    el('path', { d: 'M 8 -6 l 12 8 l 0 16' }, pump);
    const needle = el('line', { x1: 265, y1: -180, x2: 265, y2: -300, stroke: '#eef3f6', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: 265, cy: -180, r: 12, fill: '#dfe7ec' }, g);
    const sp = el('line', { x1: -265, y1: -180, x2: -265, y2: -300, stroke: '#eef3f6', 'stroke-width': 7, 'stroke-linecap': 'round', transform: 'rotate(-88 -265 -180)' }, g);
    el('circle', { cx: -265, cy: -180, r: 12, fill: '#dfe7ec' }, g);
    // wheel
    rect(g, -470, 150, 940, 84, '#11181c', { rx: 30 });
    el('circle', { cx: 0, cy: 190, r: 470, fill: 'none', stroke: '#0a0f12', 'stroke-width': 86 }, g);
    el('circle', { cx: 0, cy: 190, r: 512, fill: 'none', stroke: '#232e35', 'stroke-width': 6 }, g);
    rect(g, -150, 70, 300, 250, '#161e23', { rx: 80 });
    // sleeves and hands
    el('line', { x1: -190, y1: 250, x2: -520, y2: 900, stroke: sleeve, 'stroke-width': 170, 'stroke-linecap': 'round' }, g);
    el('line', { x1: 220, y1: 260, x2: 560, y2: 900, stroke: sleeve, 'stroke-width': 170, 'stroke-linecap': 'round' }, g);
    const bills = [['5', -36, -200], ['5', -8, -160], ['1', 20, -120]].map(([n, rot, x]) => {
      const b = el('g', {}, g);
      rect(b, -62, -260, 124, 260, '#4f7f52', { rx: 10 });
      rect(b, -50, -248, 100, 236, 'none', { rx: 6, stroke: '#9fc4a3', 'stroke-width': 4 });
      el('circle', { cx: 0, cy: -120, r: 34, fill: '#3d6a41' }, b);
      text(b, -26, -200, n, 46, { font: 'IS', w: 400, fill: '#e3f1e4' });
      text(b, 26, -34, n, 46, { font: 'IS', w: 400, fill: '#e3f1e4' });
      return { g: b, rot, x };
    });
    el('ellipse', { cx: -180, cy: 190, rx: 104, ry: 84, fill: skin }, g);
    el('ellipse', { cx: -118, cy: 130, rx: 34, ry: 62, fill: skin, transform: 'rotate(34 -118 130)' }, g);
    el('path', { d: 'M -240 170 q 40 40 110 30', fill: 'none', stroke: skinS, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: 215, cy: 200, rx: 112, ry: 86, fill: skin }, g);
    el('path', { d: 'M 150 232 q 60 26 130 4', fill: 'none', stroke: skinS, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    for (let i = 0; i < 4; i++) el('ellipse', { cx: 140 + i * 50, cy: 126 - (i === 1 || i === 2 ? 10 : 0), rx: 24, ry: 40, fill: skin }, g);
    const coins = [[176, 196, 27], [232, 180, 23], [262, 218, 25], [206, 236, 21]].map(([x, y, r]) => {
      const c = el('g', {}, g);
      el('circle', { cx: 0, cy: 0, r, fill: '#c9ced2' }, c);
      el('circle', { cx: 0, cy: 0, r: r * 0.72, fill: 'none', stroke: '#9aa3aa', 'stroke-width': 3 }, c);
      el('circle', { cx: -r * 0.3, cy: -r * 0.3, r: r * 0.2, fill: '#fff', opacity: 0.55 }, c);
      return { g: c, x, y };
    });
    const sum = text(g, 20, 20, '= $11', 96, { font: 'Hand', w: 700, fill: '#f4f8f6' });
    sum.setAttribute('transform', 'rotate(-7 20 20)');
    S.tint(g, '#b9c8de', 0.5);
    return (lt) => {
      needle.setAttribute('transform', `rotate(${(-84 + Math.sin(lt * 9) * 0.8).toFixed(2)} 265 -180)`);
      sp.setAttribute('opacity', 1);
      bills.forEach((b, i) => {
        const k = CD.eo(CD.prog(lt, 0.5 + i * 0.75, 0.9 + i * 0.75));
        b.g.setAttribute('transform', `translate(${b.x} ${(160 + (1 - k) * 260).toFixed(1)}) rotate(${b.rot})`);
        b.g.setAttribute('opacity', k.toFixed(3));
      });
      coins.forEach((c, i) => {
        const k = CD.prog(lt, 3.0 + i * 0.32, 3.3 + i * 0.32);
        const drop = (1 - CD.eo(k)) * 150 - Math.sin(Math.PI * CD.prog(lt, 3.3 + i * 0.32, 3.5 + i * 0.32)) * 10;
        c.g.setAttribute('transform', `translate(${c.x} ${(c.y - drop).toFixed(1)})`);
        c.g.setAttribute('opacity', (k > 0 ? 1 : 0));
      });
      const s = CD.back(CD.prog(lt, 4.6, 5.0));
      sum.setAttribute('opacity', CD.prog(lt, 4.6, 4.8).toFixed(3));
      sum.setAttribute('font-size', (96 * (0.7 + 0.3 * s)).toFixed(1));
    };
  };

  // ------------------------------------------------------------------ parking lot and the car as a table
  S.lot = function (g, o = {}) {
    const time = o.time || 'dusk', sky = SKY[time], dark = time !== 'day';
    rect(g, -5000, -4000, 10000, 4000, CD.vgrad(sky[0], sky[1]));
    if (time === 'evening') { el('circle', { cx: 560, cy: -900, r: 150, fill: CD.rgrad([[0, '#eef3f8', 0.35], [1, '#eef3f8', 0]]) }, g); el('circle', { cx: 560, cy: -900, r: 40, fill: '#f1f5f9' }, g); }
    if (dark) { const r = CD.rand(4); for (let i = 0; i < 26; i++) el('circle', { cx: -2000 + r() * 4000, cy: -1500 + r() * 800, r: 1.5 + r() * 2.2, fill: '#e6eef6', opacity: 0.25 + r() * 0.5 }, g); }
    else for (const [x, y, s] of [[-700, -1000, 1], [300, -1100, 0.8], [1100, -960, 0.9]]) { el('ellipse', { cx: x, cy: y, rx: 130 * s, ry: 38 * s, fill: '#fff', opacity: 0.9 }, g); el('ellipse', { cx: x + 70 * s, cy: y - 26 * s, rx: 80 * s, ry: 38 * s, fill: '#fff', opacity: 0.9 }, g); }
    // the store, far across the lot
    rect(g, -1500, -400, 1900, 260, dark ? '#263445' : '#d3dce3');
    rect(g, -1500, -424, 1900, 28, dark ? '#1d2836' : '#bfcbd4');
    rect(g, -640, -500, 380, 78, dark ? '#e9f3ee' : '#2e7d32', { rx: 8 });
    rect(g, -606, -476, 220, 12, dark ? '#2e7d32' : '#ffffff', { rx: 6 });
    rect(g, -606, -456, 140, 9, dark ? '#7fb08a' : '#a9d4ad', { rx: 4.5 });
    for (let i = 0; i < 11; i++) rect(g, -1460 + i * 170, -350, 130, 150, dark ? '#dfeaf2' : '#a8c6de', { opacity: dark ? 0.7 : 1, rx: 3 });
    rect(g, -520, -330, 140, 190, dark ? '#f1f7fb' : '#8fb4d2', { rx: 3, opacity: dark ? 0.85 : 1 });
    for (const x of [-760, 430, 1500, -2300]) {
      rect(g, x - 7, -920, 14, 780, dark ? '#0f161d' : '#7b8b99');
      rect(g, x - 70, -932, 140, 22, dark ? '#0f161d' : '#7b8b99', { rx: 8 });
      if (dark) { el('circle', { cx: x, cy: -900, r: 300, fill: CD.rgrad([[0, '#e6f0fa', 0.45], [1, '#e6f0fa', 0]]) }, g); rect(g, x - 56, -914, 112, 10, '#f4f9ff', { rx: 5 }); }
    }
    for (const [x, c] of [[-1050, '#3d4c5b'], [-90, '#4a5b6c'], [1150, '#2f3d4b']]) {
      rect(g, x - 120, -212, 240, 64, dark ? '#18222d' : c, { rx: 20 });
      rect(g, x - 70, -254, 140, 50, dark ? '#18222d' : c, { rx: 18 });
    }
    rect(g, -5000, -150, 10000, 4000, dark ? '#1f2832' : '#aab3ba');
    for (let i = -9; i <= 9; i++) rect(g, i * 420, -150, 10, 4000, '#ffffff', { opacity: dark ? 0.1 : 0.45 });
  };
  /** The family's car in profile, nose to the left. People stand behind the hood (top at about y = -205). */
  S.carSide = function (g, o = {}) {
    const dark = (o.time || 'dusk') !== 'day';
    const body = dark ? '#43576f' : '#6f86a0', bodyS = dark ? '#2e3d50' : '#566b84';
    el('ellipse', { cx: 600, cy: 70, rx: 1500, ry: 34, fill: '#000', opacity: 0.25 }, g);
    el('path', { d: 'M -540 -40 L -530 -150 Q -520 -196 -440 -200 L 20 -214 L 300 -404 Q 330 -422 380 -422 L 3000 -422 L 3000 60 L -480 60 Q -540 50 -540 -40 Z', fill: CD.vgrad(body, bodyS) }, g);
    el('path', { d: 'M 150 -238 L 338 -388 L 820 -388 L 820 -238 Z', fill: dark ? '#131c26' : '#a3c3de' }, g);
    el('path', { d: 'M 860 -388 L 1500 -388 L 1500 -238 L 860 -238 Z', fill: dark ? '#131c26' : '#a3c3de' }, g);
    el('polygon', { points: '230,-300 300,-356 420,-356 300,-244 230,-244', fill: '#ffffff', opacity: dark ? 0.05 : 0.25 }, g);
    el('path', { d: 'M 110 -214 L 110 50 M 840 -400 L 840 50', fill: 'none', stroke: bodyS, 'stroke-width': 5 }, g);
    el('path', { d: 'M -440 -198 L 14 -212', fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.22 }, g);
    el('ellipse', { cx: 150, cy: -252, rx: 36, ry: 22, fill: bodyS }, g);
    rect(g, 560, -200, 90, 14, bodyS, { rx: 7 });
    el('ellipse', { cx: -522, cy: -148, rx: 20, ry: 30, fill: dark ? '#cfd9e2' : '#eef4f8' }, g);
    rect(g, -548, -70, 60, 30, bodyS, { rx: 8 });
    el('circle', { cx: -250, cy: -10, r: 128, fill: '#11171d' }, g);
    el('circle', { cx: -250, cy: -10, r: 102, fill: '#0b0f13' }, g);
    el('circle', { cx: -250, cy: -10, r: 58, fill: dark ? '#6b7780' : '#8d9aa2' }, g);
    el('circle', { cx: -250, cy: -10, r: 16, fill: '#3b4a55' }, g);
  };

  /** A sandwich half: triangle of bread with a green edge. Origin at the bottom centre. */
  S.sandwich = function (g, flip = 1) {
    const s = el('g', {}, g);
    el('path', { d: `M ${-34 * flip} 0 L ${34 * flip} 0 L ${-34 * flip} -44 Z`, fill: '#e8dcc6' }, s);
    el('path', { d: `M ${-30 * flip} -6 L ${24 * flip} -6`, fill: 'none', stroke: '#5d9f55', 'stroke-width': 5, 'stroke-linecap': 'round' }, s);
    el('path', { d: `M ${-34 * flip} 0 L ${34 * flip} 0 L ${-34 * flip} -44 Z`, fill: 'none', stroke: '#cdbf9f', 'stroke-width': 3, 'stroke-linejoin': 'round' }, s);
    return s;
  };

  // ------------------------------------------------------------------ phone close-up: asking for help
  /**
   * The apply flow, simplified: type a title (typed and deleted), Continue, tick the confirmation, Submit.
   * o: {skin, taps: {type, next, check, submit}, title}. Returns update(lt).
   */
  S.phoneApply = function (g, o) {
    const skin = o.skin, skinS = CD.shade(skin, -0.16);
    rect(g, -5000, -4000, 10000, 8000, CD.vgrad('#0d1622', '#162435'));
    const r = CD.rand(23);
    for (let i = 0; i < 12; i++) el('circle', { cx: -900 + r() * 1800, cy: -900 + r() * 1800, r: 40 + r() * 140, fill: ['#dfeaf5', '#7fa8d6', '#a9d4ad'][i % 3], opacity: 0.05 + r() * 0.09 }, g);
    S.glow(g, 0, 0, 620, 760, 0.35);
    const ph = el('g', {}, g);
    rect(ph, -184, -376, 368, 752, '#06090c', { rx: 52 });
    rect(ph, -176, -368, 352, 736, '#1d2622', { rx: 46 });
    const clipId = CD.uid('clip');
    rect(el('clipPath', { id: clipId }, CD.defs), -166, -356, 332, 712, '#fff', { rx: 38 });
    const scr = el('g', { 'clip-path': `url(#${clipId})` }, ph);
    rect(scr, -166, -356, 332, 712, '#f7f9f6');
    const root = el('g', { transform: 'translate(-166 -356)' }, scr);
    const T = (p, x, y, s, size, q = {}) => text(p, x, y, s, size, { font: q.serif ? 'IS' : 'IN', w: q.w || 500, fill: q.fill || '#142019', anchor: q.anchor || 'start' });
    const status = (s) => { T(s, 26, 34, '11:26', 14, { w: 650 }); rect(s, 284, 22, 24, 13, 'none', { rx: 3, stroke: '#142019', 'stroke-width': 1.6 }); rect(s, 287, 25, 6, 7, '#142019', { rx: 1 }); };
    const steps = (s, n) => { for (let i = 0; i < 4; i++) rect(s, 22 + i * 74, 92, 66, 5, i < n ? '#2e7d32' : '#dbe3de', { rx: 2.5 }); };

    // 1: your story
    const s1 = el('g', {}, root);
    status(s1);
    T(s1, 22, 74, 'Apply for help', 14, { w: 650, fill: '#4a5b52' });
    steps(s1, 2);
    T(s1, 22, 146, 'Your story', 30, { serif: true });
    T(s1, 22, 190, 'Title', 13, { w: 650 });
    rect(s1, 22, 202, 288, 54, '#ffffff', { rx: 12, stroke: '#2e7d32', 'stroke-width': 2 });
    const typed = T(s1, 36, 235, '', 14.5, { w: 560 });
    const caret = rect(s1, 36, 218, 2, 22, '#2e7d32');
    T(s1, 22, 292, 'What do you need help with?', 13, { w: 650 });
    [['Food & groceries', true], ['Baby & kids', false], ['Getting around', false], ['Home & bills', false]].forEach(([n, on], i) => {
      const x = 22 + (i % 2) * 148, y = 306 + Math.floor(i / 2) * 42;
      rect(s1, x, y, 140, 34, on ? '#2e7d32' : '#ffffff', { rx: 10, stroke: on ? '#2e7d32' : '#dbe3de', 'stroke-width': 1.2 });
      T(s1, x + 70, y + 22, n, 12.5, { w: 620, anchor: 'middle', fill: on ? '#fff' : '#142019' });
    });
    for (let i = 0; i < 3; i++) rect(s1, 22, 410 + i * 22, [270, 240, 160][i], 11, '#e1e7e3', { rx: 5.5 });
    const nextB = rect(s1, 22, 500, 288, 52, '#2e7d32', { rx: 26 });
    T(s1, 166, 532, 'Continue', 17, { w: 700, fill: '#fff', anchor: 'middle' });
    rect(s1, 0, 566, 332, 146, '#d3d9de');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10 - r; c++) rect(s1, 8 + r * 16 + c * 32, 574 + r * 42, 27, 35, '#ffffff', { rx: 6 });
    rect(s1, 90, 700, 152, 8, '#ffffff', { rx: 4 });

    // 2: review
    const s2 = el('g', {}, root);
    status(s2);
    T(s2, 22, 74, 'Apply for help', 14, { w: 650, fill: '#4a5b52' });
    steps(s2, 4);
    T(s2, 22, 146, 'Review', 30, { serif: true });
    rect(s2, 22, 168, 288, 196, '#1f5130', { rx: 16 });
    T(s2, 40, 200, 'Your request', 12.5, { w: 650, fill: '#a9d4ad' });
    T(s2, 40, 236, 'Groceries for me', 22, { serif: true, fill: '#fff' });
    T(s2, 40, 264, 'and my son', 22, { serif: true, fill: '#fff' });
    rect(s2, 40, 286, 128, 26, '#ffffff', { rx: 8, opacity: 0.14 });
    T(s2, 104, 303, 'Food & groceries', 11.5, { w: 650, fill: '#fff', anchor: 'middle' });
    T(s2, 40, 342, 'Stores chosen', 11.5, { w: 560, fill: '#a9d4ad' });
    for (let i = 0; i < 2; i++) rect(s2, 130 + i * 34, 328, 26, 20, '#ffffff', { rx: 5, opacity: 0.85 });
    const box = rect(s2, 22, 392, 24, 24, '#ffffff', { rx: 6, stroke: '#2e7d32', 'stroke-width': 2 });
    const tick = el('path', { d: 'M 27 404 l 5 6 l 10 -12', fill: 'none', stroke: '#fff', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, s2);
    T(s2, 58, 402, 'Everything here is true, and', 12.5, { w: 560 });
    T(s2, 58, 420, 'I agree to the fundraiser rules.', 12.5, { w: 560 });
    const subB = rect(s2, 22, 462, 288, 54, '#2e7d32', { rx: 27 });
    T(s2, 166, 496, 'Submit request', 18, { w: 720, fill: '#fff', anchor: 'middle' });

    // 3: sent
    const s3 = el('g', {}, root);
    status(s3);
    const okC = el('circle', { cx: 166, cy: 268, r: 56, fill: '#2e7d32' }, s3);
    const okM = el('path', { d: 'M 140 268 L 159 287 L 194 250', fill: 'none', stroke: '#fff', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 90, 'stroke-dashoffset': 90 }, s3);
    T(s3, 166, 380, 'Request submitted.', 28, { serif: true, anchor: 'middle' });

    const ripple = el('circle', { r: 0, fill: '#2e7d32', opacity: 0 }, root);
    const hand = el('g', {}, g);
    el('ellipse', { cx: 40, cy: 470, rx: 250, ry: 170, fill: skin }, hand);
    el('path', { d: 'M 150 250 Q 214 240 214 300 L 206 420 Q 160 440 140 400 Z', fill: skin }, hand);
    el('path', { d: 'M 168 290 Q 196 286 200 320', fill: 'none', stroke: skinS, 'stroke-width': 4, 'stroke-linecap': 'round' }, hand);
    for (let i = 0; i < 3; i++) el('rect', { x: -214, y: 170 + i * 66, width: 54, height: 50, rx: 24, fill: skin }, hand);
    const finger = el('g', {}, g);
    el('line', { x1: 0, y1: 0, x2: 140, y2: 366, stroke: skin, 'stroke-width': 54, 'stroke-linecap': 'round' }, finger);
    el('line', { x1: 60, y1: 160, x2: 140, y2: 366, stroke: skinS, 'stroke-width': 54, 'stroke-linecap': 'round', opacity: 0.35 }, finger);
    el('ellipse', { cx: 3, cy: 4, rx: 15, ry: 19, fill: CD.shade(skin, 0.28), opacity: 0.85, transform: 'rotate(-21 3 4)' }, finger);
    S.tint(g, '#c6d2ea', 0.35);

    const tp = o.taps, full = o.title || 'Groceries for me and my son';
    // typed, deleted, typed again: [start, end, text, deleting?]
    const t0 = tp.type;
    const script = [[t0, t0 + 0.75, 'Groceries for my'], [t0 + 0.9, t0 + 1.15, 'Groceries for my', true], [t0 + 1.3, t0 + 1.85, 'Help with food'], [t0 + 2.0, t0 + 2.2, 'Help with food', true], [t0 + 2.35, t0 + 3.2, full]];
    return (lt) => {
      let str = '';
      for (const [a, b, s, del] of script) {
        if (lt < a) break;
        const k = CD.prog(lt, a, b);
        str = del ? s.slice(0, Math.round(s.length * (1 - k))) : s.slice(0, Math.round(s.length * k));
      }
      typed.textContent = str;
      const w = typed.getComputedTextLength ? typed.getComputedTextLength() : str.length * 7.4;
      caret.setAttribute('x', (38 + w).toFixed(1));
      caret.setAttribute('opacity', Math.floor(lt * 2.6) % 2 === 0 || lt < t0 + 3.2 ? 1 : 0);
      const k1 = CD.eio(CD.prog(lt, tp.next + 0.12, tp.next + 0.42));
      const k2 = CD.eio(CD.prog(lt, tp.submit + 0.18, tp.submit + 0.48));
      s1.setAttribute('transform', `translate(${(-332 * k1).toFixed(1)} 0)`);
      s2.setAttribute('transform', `translate(${(332 * (1 - k1) - 332 * k2).toFixed(1)} 0)`);
      s3.setAttribute('transform', `translate(${(332 * (1 - k2)).toFixed(1)} 0)`);
      const checked = lt >= tp.check;
      box.setAttribute('fill', checked ? '#2e7d32' : '#ffffff');
      tick.setAttribute('opacity', checked ? 1 : 0);
      const press = (t) => 1 - 0.04 * CD.win(lt, t - 0.05, t + 0.18, 0.1);
      nextB.setAttribute('transform', `translate(166 526) scale(${press(tp.next)}) translate(-166 -526)`);
      subB.setAttribute('transform', `translate(166 489) scale(${press(tp.submit)}) translate(-166 -489)`);
      okC.setAttribute('r', (56 * CD.back(CD.prog(lt, tp.submit + 0.42, tp.submit + 0.8))).toFixed(2));
      okM.setAttribute('stroke-dashoffset', (90 * (1 - CD.eo(CD.prog(lt, tp.submit + 0.5, tp.submit + 0.95)))).toFixed(1));
      const pts = [[166, 526, tp.next], [34, 404, tp.check], [166, 489, tp.submit]];
      // while typing, the thumb hovers over the keyboard area and jitters
      const typing = lt > t0 && lt < t0 + 3.2;
      const hover = [180 + Math.sin(lt * 23) * 70, 620 + Math.cos(lt * 31) * 30];
      const keys = [[0, [260, 660]], [t0, hover], [t0 + 3.2, hover], ...pts.flatMap(([x, y, t]) => [[t - 0.3, [x + 18, y + 26]], [t + 0.08, [x + 18, y + 26]]]), [tp.submit + 0.75, [460, 980]]];
      let fp = CD.track(keys, lt, CD.sine);
      if (typing) fp = hover;
      const down = Math.max(...pts.map(([, , t]) => CD.win(lt, t - 0.07, t + 0.12, 0.06)));
      finger.setAttribute('transform', `translate(${(fp[0] - 166 - 14).toFixed(1)} ${(fp[1] - 356 - 22 + down * 4).toFixed(1)}) scale(${(1 - 0.05 * down).toFixed(3)})`);
      let rp = null;
      for (const [x, y, t] of pts) if (lt >= t && lt < t + 0.45) rp = [x, y, CD.prog(lt, t, t + 0.45)];
      if (rp) { ripple.setAttribute('cx', rp[0]); ripple.setAttribute('cy', rp[1]); ripple.setAttribute('r', (8 + 40 * CD.eo(rp[2])).toFixed(1)); ripple.setAttribute('opacity', (0.35 * (1 - rp[2])).toFixed(3)); }
      else ripple.setAttribute('opacity', 0);
    };
  };
})();
