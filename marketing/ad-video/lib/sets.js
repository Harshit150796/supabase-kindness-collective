/* Backgrounds, furniture and the phone close-up for the video ads. Floor line is y = 0 unless noted. */
(function () {
  'use strict';
  const CD = window.CD;
  const { el } = CD;
  const S = (CD.sets = {});
  const rect = (g, x, y, w, h, fill, extra = {}) => el('rect', { x, y, width: w, height: h, fill, ...extra }, g);
  const PRODUCTS = ['#1565c0', '#2e7d32', '#7fb0e3', '#a9d4ad', '#4a5b6c', '#d6dde3', '#1f5130', '#5b9be0', '#90a4ae', '#eef2f4', '#3d6b8f', '#6c9a6f'];

  function shelves(g, x0, x1, base, top, seed, scale = 1) {
    const r = CD.rand(seed);
    const unit = 300 * scale;
    for (let x = x0; x < x1; x += unit + 30 * scale) {
      rect(g, x, top, unit, base - top, '#cdd6d0');
      const rows = 4;
      for (let i = 1; i <= rows; i++) {
        const sy = base - ((base - top) / rows) * i + 22 * scale;
        rect(g, x, sy, unit, 8 * scale, '#a9b5ad');
        let px = x + 8 * scale;
        while (px < x + unit - 10 * scale) {
          const w = (16 + r() * 26) * scale, h = (38 + r() * 64) * scale;
          if (px + w > x + unit - 6 * scale) break;
          rect(g, px, sy - h, w, h, PRODUCTS[Math.floor(r() * PRODUCTS.length)], { rx: 2 });
          px += w + 3 * scale;
        }
      }
    }
  }

  /** Grocery store back wall with shelves, signs and ceiling lights. */
  S.store = function (g, o = {}) {
    rect(g, -4000, -3000, 8000, 3000, '#e1e8e3');
    for (let i = -8; i <= 8; i++) rect(g, i * 380 - 120, -1060, 240, 16, '#ffffff', { rx: 8, opacity: 0.95 });
    rect(g, -4000, -1050, 8000, 420, CD.vgrad('#ffffff', '#e1e8e3'), { opacity: 0.6 });
    for (const x of [-1500, -760, -20, 720, 1460]) {
      el('line', { x1: x - 70, y1: -1050, x2: x - 70, y2: -900, stroke: '#9aa8a0', 'stroke-width': 3 }, g);
      el('line', { x1: x + 70, y1: -1050, x2: x + 70, y2: -900, stroke: '#9aa8a0', 'stroke-width': 3 }, g);
      rect(g, x - 120, -900, 240, 70, '#1f5130', { rx: 9 });
      rect(g, x - 88, -876, 130, 11, '#ffffff', { rx: 5, opacity: 0.92 });
      rect(g, x - 88, -856, 76, 9, '#a9d4ad', { rx: 4 });
    }
    shelves(g, -2600, 2600, -80, -720, o.seed || 3);
    rect(g, -4000, -760, 8000, 690, '#e1e8e3', { opacity: 0.4 });
    rect(g, -4000, -80, 8000, 3000, '#d0d8d2');
    rect(g, -4000, -80, 8000, 5, '#c0c9c3');
  };

  /** Checkout counter in front of the customers, with a moving belt. Returns update(t). */
  S.counter = function (g) {
    rect(g, -1600, -200, 3200, 1200, CD.vgrad('#34463c', '#243129'));
    rect(g, -1600, -214, 3200, 16, '#56685e');
    rect(g, -1600, -199, 3200, 5, '#1b2520', { opacity: 0.55 });
    for (let i = -6; i <= 6; i++) rect(g, i * 260 - 2, -190, 4, 1100, '#2c3b33', { opacity: 0.6 });
    const belt = el('g', {}, g);
    rect(belt, -1600, -224, 1500, 11, '#1a221e', { rx: 3 });
    const stripes = el('g', {}, belt);
    for (let i = 0; i < 70; i++) rect(stripes, -1600 + i * 22, -224, 3, 11, '#2b3631');
    return (t) => stripes.setAttribute('transform', `translate(${((t * 26) % 22).toFixed(2)} 0)`);
  };

  /** Card reader on a short stand. Origin at the counter top. set(state): idle|processing|declined|approved. */
  S.reader = function (parent, x, y) {
    const g = el('g', { transform: `translate(${x} ${y})` }, parent);
    rect(g, -5, -58, 10, 58, '#2b3530');
    rect(g, -26, -64, 52, 9, '#2b3530', { rx: 4 });
    rect(g, -40, -184, 80, 126, '#18211d', { rx: 13 });
    const scr = rect(g, -33, -176, 66, 54, '#e8efe9', { rx: 6 });
    const icon = el('g', {}, g);
    const ring = el('circle', { cx: 0, cy: -157, r: 11, fill: 'none', 'stroke-width': 3 }, icon);
    const mark = el('path', { fill: 'none', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, icon);
    const label = el('text', { x: 0, y: -132, 'text-anchor': 'middle', 'font-family': 'IN', 'font-weight': 760, 'font-size': 9.6, 'letter-spacing': 0.6 }, g);
    const dots = el('g', {}, g);
    for (let i = 0; i < 3; i++) el('circle', { cx: -9 + i * 9, cy: -157, r: 3.2, fill: '#4a5b52' }, dots);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) rect(g, -24 + c * 18, -110 + r * 14, 12, 8, '#36433d', { rx: 2 });
    rect(g, -36, -186, 72, 3, '#ffffff', { opacity: 0.08, rx: 1.5 });
    return {
      g,
      set(state, t = 0) {
        dots.style.display = state === 'processing' ? '' : 'none';
        icon.style.display = state === 'declined' || state === 'approved' ? '' : 'none';
        if (state === 'processing') {
          [...dots.children].forEach((d, i) => d.setAttribute('opacity', (0.3 + 0.7 * Math.max(0, Math.sin(t * 7 - i * 0.9))).toFixed(2)));
          scr.setAttribute('fill', '#e8efe9'); label.setAttribute('fill', '#1d2723'); label.textContent = 'PROCESSING'; label.setAttribute('font-size', 8.2);
        } else if (state === 'declined') {
          scr.setAttribute('fill', '#1b2420'); label.setAttribute('fill', '#ffffff'); label.textContent = 'DECLINED'; label.setAttribute('font-size', 9.6);
          ring.setAttribute('stroke', '#ffffff'); mark.setAttribute('stroke', '#ffffff'); mark.setAttribute('d', 'M -4.5 -161.5 L 4.5 -152.5 M 4.5 -161.5 L -4.5 -152.5');
        } else if (state === 'approved') {
          scr.setAttribute('fill', '#2e7d32'); label.setAttribute('fill', '#ffffff'); label.textContent = 'APPROVED'; label.setAttribute('font-size', 9.4);
          ring.setAttribute('stroke', '#ffffff'); mark.setAttribute('stroke', '#ffffff'); mark.setAttribute('d', 'M -5 -157 L -1.5 -153 L 5.5 -161');
        } else {
          scr.setAttribute('fill', '#e8efe9'); label.setAttribute('fill', '#1d2723'); label.textContent = 'TAP OR INSERT'; label.setAttribute('font-size', 7.4);
        }
      },
    };
  };

  /** Bright home (donor). An island hides everything below y = -200. */
  S.home = function (g, o = {}) {
    const wall = o.wall || '#e6edf1';
    rect(g, -4000, -3000, 8000, 3000, wall);
    // window with a calm city view
    const wx = o.window ?? -560;
    rect(g, wx - 10, -860, 420, 470, '#f6f8f9', { rx: 6 });
    rect(g, wx, -850, 400, 450, CD.vgrad('#bfdcf2', '#e6f2fa'));
    const r = CD.rand(11);
    for (let i = 0; i < 9; i++) { const h = 60 + r() * 160; rect(g, wx + i * 46, -400 - h, 40, h, '#c9dbe8'); }
    rect(g, wx + 196, -850, 8, 450, '#f6f8f9');
    rect(g, wx, -630, 400, 8, '#f6f8f9');
    // pendant lamp
    el('line', { x1: o.lampX ?? 260, y1: -1400, x2: o.lampX ?? 260, y2: -760, stroke: '#2b3530', 'stroke-width': 3 }, g);
    el('path', { d: `M ${(o.lampX ?? 260) - 70} -700 Q ${o.lampX ?? 260} -790 ${(o.lampX ?? 260) + 70} -700 Z`, fill: '#1f5130' }, g);
    // framed art
    rect(g, 420, -820, 200, 250, '#f7f9fa', { rx: 4 });
    rect(g, 436, -804, 168, 218, '#dfe9e2');
    el('circle', { cx: 500, cy: -720, r: 46, fill: '#2e7d32', opacity: 0.85 }, g);
    el('circle', { cx: 548, cy: -660, r: 34, fill: '#1565c0', opacity: 0.8 }, g);
    // plant on a stand
    rect(g, 760, -320, 120, 320, '#d4dde3');
    el('path', { d: 'M 780 -320 L 860 -320 L 850 -250 L 790 -250 Z', fill: '#4a5b6c' }, g);
    for (let i = 0; i < 9; i++) {
      const a = -150 + i * 15;
      el('ellipse', { cx: 0, cy: 0, rx: 14, ry: 64, fill: i % 2 ? '#2e7d32' : '#4f7f52', transform: `translate(820 -330) rotate(${a + 90}) translate(0 -58)` }, g);
    }
    // floor and island
    rect(g, -4000, -60, 8000, 3000, '#d9e0e4');
    rect(g, -1600, -212, 3200, 18, '#f3f5f4', { rx: 3 });
    rect(g, -1600, -196, 3200, 1200, CD.vgrad('#355046', '#283d34'));
    for (let i = -6; i <= 6; i++) rect(g, i * 300 - 2, -186, 4, 900, '#22362c', { opacity: 0.55 });
    const mug = CD.prop('mug', { color: '#1565c0' });
    mug.setAttribute('transform', `translate(${o.mugX ?? 230} -212) scale(1.6)`);
    g.appendChild(mug);
  };

  /** Kitchen table at night (or in the morning with o.day). The table front hides everything below y = -196. */
  S.kitchen = function (g, o = {}) {
    const day = !!o.day;
    rect(g, -4000, -3000, 8000, 3000, day ? '#e4ecf0' : '#223440');
    // window
    rect(g, -660, -880, 380, 440, day ? '#f6f8f9' : '#33485a', { rx: 6 });
    rect(g, -650, -870, 360, 420, day ? CD.vgrad('#bfe0f5', '#eaf5fb') : CD.vgrad('#0f1b26', '#1c2d3c'));
    if (day) { el('ellipse', { cx: -520, cy: -780, rx: 60, ry: 22, fill: '#fff', opacity: 0.8 }, g); el('ellipse', { cx: -400, cy: -720, rx: 46, ry: 16, fill: '#fff', opacity: 0.7 }, g); }
    else {
      el('circle', { cx: -380, cy: -790, r: 30, fill: '#e3eaee' }, g);
      el('circle', { cx: -366, cy: -800, r: 27, fill: '#16232f' }, g);
      const r = CD.rand(5);
      for (let i = 0; i < 14; i++) el('circle', { cx: -640 + r() * 340, cy: -860 + r() * 380, r: 1.2 + r() * 1.6, fill: '#e3eaee', opacity: 0.4 + r() * 0.5 }, g);
    }
    rect(g, -476, -870, 8, 420, day ? '#f6f8f9' : '#33485a');
    rect(g, -650, -664, 360, 8, day ? '#f6f8f9' : '#33485a');
    // cabinets and fridge
    rect(g, 300, -980, 760, 260, day ? '#d3dde3' : '#2c3f4c');
    for (let i = 0; i < 4; i++) rect(g, 310 + i * 188, -970, 178, 240, day ? '#dde5ea' : '#304656', { rx: 4 });
    rect(g, 1100, -900, 300, 900, day ? '#dfe6ea' : '#2f4250', { rx: 10 });
    rect(g, 1120, -720, 8, 120, day ? '#aab6be' : '#4b6070', { rx: 4 });
    // hanging lamp and its light
    el('line', { x1: 0, y1: -1600, x2: 0, y2: -760, stroke: day ? '#3c4a44' : '#0f171c', 'stroke-width': 3 }, g);
    if (!day) el('ellipse', { cx: 0, cy: -380, rx: 520, ry: 420, fill: CD.rgrad([[0, '#f4f8f6', 0.3], [1, '#f4f8f6', 0]]) }, g);
    el('path', { d: 'M -80 -700 Q 0 -800 80 -700 Z', fill: '#2e7d32' }, g);
    el('ellipse', { cx: 0, cy: -700, rx: 46, ry: 7, fill: day ? '#cfd8dc' : '#f2f7f3', opacity: day ? 0.8 : 0.95 }, g);
    rect(g, -4000, -60, 8000, 3000, day ? '#d5dde1' : '#192730');
    // table
  };
  /** The kitchen table in front of the people, with a floor-length cloth (draw it after them). */
  S.table = function (g, o = {}) {
    const day = !!o.day;
    rect(g, -1100, -212, 2200, 16, day ? '#5f7a6c' : '#3f564b', { rx: 3 });
    rect(g, -1080, -198, 2160, 1200, day ? CD.vgrad('#cfdcd3', '#b9cabf') : CD.vgrad('#3b5047', '#2c3d36'));
    for (let i = -7; i <= 7; i++) rect(g, i * 150 - 2, -190, 4, 1200, day ? '#b3c5b9' : '#2a3a33', { opacity: 0.7 });
    rect(g, -1080, -198, 2160, 6, '#000', { opacity: 0.12 });
  };
  /** Top-down view of a sheet of paper with a handwritten list. Returns {strike(i, k), check(i, k), tip(i, k)}. */
  S.listPaper = function (g, items, o = {}) {
    const day = !!o.day;
    rect(g, -3000, -3000, 6000, 6000, day ? '#7f998b' : '#2f4239');
    for (let i = -30; i <= 30; i++) rect(g, -3000, i * 44, 6000, 2, day ? '#76907f' : '#2a3b33', { opacity: 0.8 });
    if (!day) el('ellipse', { cx: 40, cy: -40, rx: 620, ry: 560, fill: CD.rgrad([[0, '#f3f8f4', 0.28], [1, '#f3f8f4', 0]]) }, g);
    const mug = el('g', { transform: 'translate(-330 -250)' }, g);
    el('circle', { cx: 0, cy: 0, r: 52, fill: '#1565c0' }, mug);
    el('circle', { cx: 0, cy: 0, r: 40, fill: day ? '#e8efe9' : '#3b2a22' }, mug);
    el('rect', { x: 46, y: -12, width: 30, height: 24, rx: 10, fill: '#1565c0' }, mug);
    const paper = el('g', { transform: `rotate(${o.rot ?? -4})` }, g);
    rect(paper, -214, -290, 428, 560, '#000', { opacity: 0.18, rx: 4, transform: 'translate(8 10)' });
    rect(paper, -214, -290, 428, 560, '#fbfcfa', { rx: 4 });
    for (let i = 0; i < 11; i++) rect(paper, -214, -200 + i * 44, 428, 2, '#cfe0f0');
    rect(paper, -150, -290, 2, 560, '#a9c8e8');
    const title = el('text', { x: -128, y: -224, 'font-family': 'Hand', 'font-size': 46, fill: '#1d3557' }, paper);
    title.textContent = o.title || 'Groceries';
    const rows = items.map((txt, i) => {
      const y = -160 + i * 66;
      const t = el('text', { x: -126, y, 'font-family': 'Hand', 'font-size': 44, fill: '#1d3557' }, paper);
      t.textContent = txt;
      const w = Math.max(70, txt.length * 19);
      const line = el('path', { d: `M -134 ${y - 14} Q ${-126 + w / 2} ${y - 22} ${-118 + w} ${y - 13}`, fill: 'none', stroke: '#1d3557', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': w + 40, 'stroke-dashoffset': w + 40, opacity: 0 }, paper);
      const chk = el('path', { d: `M ${-108 + w} ${y - 16} l 12 14 l 26 -34`, fill: 'none', stroke: '#2e7d32', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 60, 'stroke-dashoffset': 60, opacity: 0 }, paper);
      return { line, chk, w, y };
    });
    return {
      strike(i, k) { const r = rows[i]; r.line.setAttribute('stroke-dashoffset', ((r.w + 40) * (1 - k)).toFixed(1)); r.line.setAttribute('opacity', k > 0.02 ? 1 : 0); },
      check(i, k) { rows[i].chk.setAttribute('stroke-dashoffset', (60 * (1 - k)).toFixed(1)); rows[i].chk.setAttribute('opacity', k > 0.02 ? 1 : 0); },
      /** World position of the pen tip while striking row i at progress k (paper is rotated). */
      tip(i, k) {
        const r = rows[i], a = ((o.rot ?? -4) * Math.PI) / 180;
        const x = -134 + (r.w + 16) * k, y = r.y - 14 - Math.sin(Math.PI * k) * 6;
        return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
      },
    };
  };

  /** Child's bedroom at night with a desk in front (desk top at y = -128). */
  S.kidRoom = function (g) {
    rect(g, -4000, -3000, 8000, 3000, '#26384c');
    rect(g, -580, -620, 300, 330, '#3b5068', { rx: 6 });
    rect(g, -570, -610, 280, 310, CD.vgrad('#0f1b28', '#1b2b3d'));
    el('circle', { cx: -360, cy: -540, r: 24, fill: '#e3eaee' }, g);
    el('circle', { cx: -348, cy: -548, r: 21, fill: '#132131' }, g);
    rect(g, -434, -610, 6, 310, '#3b5068');
    const r = CD.rand(9);
    for (let i = 0; i < 9; i++) { const x = 160 + r() * 520, y = -700 + r() * 380; el('path', { d: `M ${x} ${y - 9} L ${x + 3} ${y - 3} L ${x + 9} ${y - 2} L ${x + 4} ${y + 2} L ${x + 6} ${y + 9} L ${x} ${y + 5} L ${x - 6} ${y + 9} L ${x - 4} ${y + 2} L ${x - 9} ${y - 2} L ${x - 3} ${y - 3} Z`, fill: '#a9d4ad', opacity: 0.45 }, g); }
    // bed in the background
    rect(g, 380, -230, 520, 120, '#3f5a78', { rx: 18 });
    rect(g, 400, -270, 140, 60, '#dfe7ee', { rx: 20 });
    rect(g, 380, -120, 520, 60, '#2c4058');
    rect(g, -4000, -60, 8000, 3000, '#1a2737');
    // light from the desk lamp
    el('ellipse', { cx: 120, cy: -170, rx: 330, ry: 200, fill: CD.rgrad([[0, '#eef6f0', 0.32], [1, '#eef6f0', 0]]) }, g);
  };
  S.desk = function (g) {
    rect(g, -700, -140, 1400, 14, '#5c7a6b', { rx: 3 });
    rect(g, -690, -126, 1380, 1000, CD.vgrad('#3e584b', '#2c4137'));
    for (const x of [-360, 0, 360]) rect(g, x - 2, -120, 4, 900, '#2a3d33', { opacity: 0.6 });
  };

  /** Doorway seen from inside a dark room, lit hallway behind. */
  S.doorway = function (g) {
    rect(g, -4000, -3000, 8000, 3000, '#22334a');
    rect(g, -190, -760, 380, 760, '#c9d6e2');
    rect(g, -190, -760, 380, 760, CD.vgrad('#e4ecf3', '#b3c4d4'));
    rect(g, -214, -784, 24, 784, '#3e5168');
    rect(g, 190, -784, 24, 784, '#3e5168');
    rect(g, -214, -784, 428, 24, '#3e5168');
    el('polygon', { points: '-190,0 190,0 520,420 -520,420', fill: '#9fb2c4', opacity: 0.25 }, g);
    rect(g, -4000, -2, 8000, 3000, '#1a2737', { opacity: 0.85 });
    el('polygon', { points: '-190,0 190,0 460,600 -460,600', fill: '#c9d6e2', opacity: 0.18 }, g);
  };

  /** Morning street outside a school. */
  S.street = function (g) {
    rect(g, -4000, -3000, 8000, 3000, CD.vgrad('#b9dcf3', '#eaf5fb'));
    el('circle', { cx: 520, cy: -900, r: 70, fill: '#ffffff', opacity: 0.85 }, g);
    for (const [x, y, s] of [[-700, -960, 1], [-240, -1040, 0.7], [900, -1000, 0.8]]) {
      el('ellipse', { cx: x, cy: y, rx: 110 * s, ry: 34 * s, fill: '#fff', opacity: 0.9 }, g);
      el('ellipse', { cx: x + 60 * s, cy: y - 22 * s, rx: 70 * s, ry: 34 * s, fill: '#fff', opacity: 0.9 }, g);
    }
    // school building
    rect(g, -900, -760, 1800, 600, '#dde5ec');
    rect(g, -900, -790, 1800, 34, '#c7d3dd');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) { if (c === 3 || c === 4) continue; rect(g, -840 + c * 216, -700 + r * 190, 120, 120, '#a8c6de', { rx: 4 }); rect(g, -840 + c * 216 + 58, -700 + r * 190, 4, 120, '#dde5ec'); }
    rect(g, -120, -470, 240, 310, '#1f5130', { rx: 6 });
    rect(g, -4, -470, 8, 310, '#173d24');
    // trees
    for (const x of [-1300, -1060, 1080, 1320]) {
      rect(g, x - 14, -360, 28, 220, '#4a5b52');
      el('circle', { cx: x, cy: -420, r: 120, fill: '#3f8a46' }, g);
      el('circle', { cx: x - 70, cy: -360, r: 80, fill: '#4f9a55' }, g);
      el('circle', { cx: x + 70, cy: -370, r: 84, fill: '#2e7d32' }, g);
    }
    rect(g, -4000, -160, 8000, 60, '#8cc08f');
    rect(g, -4000, -100, 8000, 3000, '#cfd6db');
    for (let i = -12; i <= 12; i++) rect(g, i * 220, -100, 4, 3000, '#bcc5cb');
  };

  /** Store aisle close behind a shopper (bumper). */
  S.aisle = function (g) {
    rect(g, -4000, -3000, 8000, 3000, '#e1e8e3');
    shelves(g, -2400, 2400, -40, -900, 21, 1.25);
    rect(g, -4000, -900, 8000, 860, '#e1e8e3', { opacity: 0.28 });
    rect(g, -4000, -40, 8000, 3000, '#d0d8d2');
  };

  /** Shopping cart (front view) that hides the shopper's legs. Origin on the floor. */
  S.cart = function (g, x = 0) {
    const c = el('g', { transform: `translate(${x} 0)` }, g);
    const st = { stroke: '#8d9aa2', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' };
    el('path', { d: 'M -230 -330 L 230 -330 L 200 -110 L -200 -110 Z', fill: '#b9c4ca', opacity: 0.35 }, c);
    for (let i = 0; i <= 10; i++) { const x0 = -230 + i * 46, x1 = -200 + i * 40; el('line', { x1: x0, y1: -330, x2: x1, y2: -110, ...st, 'stroke-width': 3 }, c); }
    for (let j = 1; j < 5; j++) { const y = -330 + j * 44, k = j / 5; el('line', { x1: -230 + 30 * k, y1: y, x2: 230 - 30 * k, y2: y, ...st, 'stroke-width': 3 }, c); }
    el('path', { d: 'M -230 -330 L 230 -330 L 200 -110 L -200 -110 Z', ...st }, c);
    el('path', { d: 'M -200 -110 L -190 -30 M 200 -110 L 190 -30', ...st }, c);
    el('line', { x1: -240, y1: -40, x2: 240, y2: -40, ...st }, c);
    for (const wx of [-190, 190]) el('circle', { cx: wx, cy: -16, r: 16, fill: '#2b3530' }, c);
    rect(c, -250, -350, 500, 16, '#1f5130', { rx: 8 });
    return c;
  };

  // ------------------------------------------------------------ phone close-up
  /**
   * Big phone held in a hand, showing a simplified CouponDonation donate flow.
   * o: {need: 'Food & groceries', tile: 0|1|2, skin, taps: {chip, donate, give}} (seconds, shot-local).
   * Returns update(lt).
   */
  S.phone = function (g, o) {
    const skin = o.skin || CD.SKIN.medium, skinS = CD.shade(skin, -0.16);
    // soft background: out-of-focus room
    rect(g, -3000, -3000, 6000, 6000, CD.vgrad(o.bgTop || '#dfe8ee', o.bgBottom || '#c9d6de'));
    const r = CD.rand(17);
    for (let i = 0; i < 16; i++) el('circle', { cx: -900 + r() * 1800, cy: -900 + r() * 1800, r: 40 + r() * 150, fill: ['#ffffff', '#a9d4ad', '#a8c6de'][i % 3], opacity: 0.12 + r() * 0.2 }, g);

    const ph = el('g', {}, g);
    rect(ph, -184, -376, 368, 752, '#121915', { rx: 52 });
    rect(ph, -176, -368, 352, 736, '#1d2622', { rx: 46 });
    const clipId = CD.uid('clip');
    const cp = el('clipPath', { id: clipId }, CD.defs);
    rect(cp, -166, -356, 332, 712, '#fff', { rx: 38 });
    const scr = el('g', { 'clip-path': `url(#${clipId})` }, ph);
    rect(scr, -166, -356, 332, 712, '#f7f9f6');
    const root = el('g', { transform: 'translate(-166 -356)' }, scr);
    const T = (parent, x, y, txt, size, opts = {}) => {
      const t = el('text', { x, y, 'font-family': opts.serif ? 'IS' : 'IN', 'font-size': size, 'font-weight': opts.w || 500, fill: opts.fill || '#142019', 'text-anchor': opts.anchor || 'start', 'letter-spacing': opts.ls || 0 }, parent);
      t.textContent = txt;
      return t;
    };
    const status = (s) => { T(s, 26, 34, '9:41', 14, { w: 650 }); rect(s, 262, 24, 18, 10, '#142019', { rx: 2 }); rect(s, 284, 22, 24, 13, 'none', { rx: 3, stroke: '#142019', 'stroke-width': 1.6 }); rect(s, 287, 25, 15, 7, '#142019', { rx: 1 }); };

    // Screen 1: fundraisers open now
    const s1 = el('g', {}, root);
    status(s1);
    const logo = el('image', { href: '../../../public/favicon-192.png', x: 22, y: 52, width: 32, height: 32 }, s1);
    logo.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const wm = T(s1, 62, 75, '', 18, { w: 760, ls: -0.3 });
    el('tspan', { fill: '#2e7d32' }, wm).textContent = 'Coupon';
    el('tspan', { fill: '#1565c0' }, wm).textContent = 'Donation';
    T(s1, 22, 130, 'Fundraisers open now', 27, { serif: true });
    const needs = ['All needs', 'Food & groceries', 'Baby & kids', 'School & learning', 'Health & pharmacy', 'Getting around'];
    const chips = needs.map((n, i) => {
      const x = 22 + (i % 2) * 148, y = 148 + Math.floor(i / 2) * 42;
      const c = el('g', {}, s1);
      const b = rect(c, x, y, 140, 34, '#ffffff', { rx: 10, stroke: '#dbe3de', 'stroke-width': 1.2 });
      const t = T(c, x + 70, y + 22, n, 12.5, { w: 620, anchor: 'middle' });
      return { n, b, t, cx: x + 70, cy: y + 17 };
    });
    rect(s1, 22, 284, 288, 148, '#e6f1e7', { rx: 14 });
    const cpn = el('g', { transform: 'translate(166 362) rotate(-6)' }, s1);
    rect(cpn, -84, -38, 168, 76, '#2e7d32', { rx: 10 });
    el('line', { x1: -30, y1: -30, x2: -30, y2: 30, stroke: '#a9d4ad', 'stroke-width': 3, 'stroke-dasharray': '5 5' }, cpn);
    T(cpn, -57, 13, '$', 34, { serif: true, fill: '#fff', anchor: 'middle' });
    rect(cpn, -16, -12, 80, 9, '#ffffff', { rx: 4.5, opacity: 0.9 });
    rect(cpn, -16, 4, 54, 8, '#a9d4ad', { rx: 4 });
    const tag = el('g', {}, s1);
    rect(tag, 34, 296, 128, 26, '#ffffff', { rx: 8 });
    const tagT = T(tag, 98, 313, o.need, 11.5, { w: 650, anchor: 'middle', fill: '#2e7d32' });
    rect(s1, 22, 448, 228, 13, '#d5ddd8', { rx: 6.5 });
    rect(s1, 22, 470, 170, 13, '#e1e7e3', { rx: 6.5 });
    rect(s1, 22, 498, 288, 8, '#e2e8e4', { rx: 4 });
    rect(s1, 22, 498, 176, 8, '#2e7d32', { rx: 4 });
    const donateB = rect(s1, 22, 526, 288, 50, '#2e7d32', { rx: 25 });
    T(s1, 166, 557, 'Donate', 17, { w: 700, fill: '#fff', anchor: 'middle' });

    // Screen 2: your gift
    const s2 = el('g', {}, root);
    status(s2);
    T(s2, 22, 80, '‹  Back', 15, { w: 600, fill: '#4a5b52' });
    T(s2, 22, 134, 'Your gift', 31, { serif: true });
    el('circle', { cx: 56, cy: 212, r: 22, fill: '#eef3ef' }, s2);
    T(s2, 56, 220, '−', 24, { w: 600, anchor: 'middle', fill: '#2e7d32' });
    el('circle', { cx: 276, cy: 212, r: 22, fill: '#eef3ef' }, s2);
    T(s2, 276, 220, '+', 24, { w: 600, anchor: 'middle', fill: '#2e7d32' });
    T(s2, 166, 234, '$10', 66, { serif: true, anchor: 'middle' });
    T(s2, 22, 296, 'Choose stores', 14, { w: 650 });
    const tileLabels = ['Groceries', 'Baby & kids', 'School'];
    const tiles = tileLabels.map((lab, i) => {
      const x = 22 + i * 98, y = 310;
      const tg = el('g', {}, s2);
      const b = rect(tg, x, y, 90, 80, '#ffffff', { rx: 14, stroke: '#dbe3de', 'stroke-width': 1.4 });
      const ic = el('g', { transform: `translate(${x + 45} ${y + 34})`, fill: 'none', stroke: '#2e7d32', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, tg);
      if (i === 0) { el('path', { d: 'M -16 -10 L -11 -10 L -6 8 L 12 8 L 16 -4 L -9 -4' }, ic); el('circle', { cx: -3, cy: 14, r: 2.2, fill: '#2e7d32' }, ic); el('circle', { cx: 9, cy: 14, r: 2.2, fill: '#2e7d32' }, ic); }
      if (i === 1) { el('path', { d: 'M -6 -16 L 6 -16 L 6 -10 L 9 -6 L 9 14 L -9 14 L -9 -6 L -6 -10 Z' }, ic); el('line', { x1: -9, y1: 2, x2: 9, y2: 2 }, ic); }
      if (i === 2) { el('path', { d: 'M 0 -10 Q -8 -15 -16 -12 L -16 12 Q -8 9 0 14 Q 8 9 16 12 L 16 -12 Q 8 -15 0 -10 Z' }, ic); el('line', { x1: 0, y1: -10, x2: 0, y2: 14 }, ic); }
      T(tg, x + 45, y + 70, lab, 11, { w: 620, anchor: 'middle', fill: '#4a5b52' });
      return { b, cx: x + 45, cy: y + 40 };
    });
    T(s2, 22, 428, '100% of your gift reaches the family.', 13, { w: 560 });
    T(s2, 22, 450, 'No platform fee.', 13, { w: 650, fill: '#2e7d32' });
    const giveB = rect(s2, 22, 474, 288, 54, '#2e7d32', { rx: 27 });
    T(s2, 166, 508, 'Give $10', 19, { w: 720, fill: '#fff', anchor: 'middle' });
    T(s2, 166, 556, 'You get a receipt for every gift.', 12, { w: 540, anchor: 'middle', fill: '#6b7a72' });

    // Screen 3: thank you
    const s3 = el('g', {}, root);
    status(s3);
    const okC = el('circle', { cx: 166, cy: 268, r: 56, fill: '#2e7d32' }, s3);
    const okM = el('path', { d: 'M 140 268 L 159 287 L 194 250', fill: 'none', stroke: '#fff', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 90, 'stroke-dashoffset': 90 }, s3);
    T(s3, 166, 380, 'Thank you for giving.', 28, { serif: true, anchor: 'middle' });
    T(s3, 166, 412, 'Your donation has been successfully processed.', 12.5, { w: 520, anchor: 'middle', fill: '#4a5b52' });

    const ripple = el('circle', { r: 0, fill: '#2e7d32', opacity: 0 }, root);

    // hand holding the phone
    const hand = el('g', {}, g);
    el('ellipse', { cx: 40, cy: 470, rx: 250, ry: 170, fill: skin }, hand);
    el('path', { d: 'M 150 250 Q 214 240 214 300 L 206 420 Q 160 440 140 400 Z', fill: skin }, hand);
    el('path', { d: 'M 168 290 Q 196 286 200 320', fill: 'none', stroke: skinS, 'stroke-width': 4, 'stroke-linecap': 'round' }, hand);
    for (let i = 0; i < 3; i++) el('rect', { x: -214, y: 170 + i * 66, width: 54, height: 50, rx: 24, fill: skin }, hand);
    el('path', { d: 'M -200 380 Q -150 420 -60 400', fill: 'none', stroke: skinS, 'stroke-width': 4, 'stroke-linecap': 'round' }, hand);

    // the other hand's index finger, reaching in from the lower right (outside the screen clip)
    const finger = el('g', {}, g);
    el('line', { x1: 10, y1: 14, x2: 150, y2: 380, stroke: '#000', 'stroke-width': 58, 'stroke-linecap': 'round', opacity: 0.1 }, finger);
    el('line', { x1: 0, y1: 0, x2: 140, y2: 366, stroke: skin, 'stroke-width': 54, 'stroke-linecap': 'round' }, finger);
    el('line', { x1: 60, y1: 160, x2: 140, y2: 366, stroke: skinS, 'stroke-width': 54, 'stroke-linecap': 'round', opacity: 0.35 }, finger);
    el('ellipse', { cx: 3, cy: 4, rx: 15, ry: 19, fill: CD.shade(skin, 0.28), opacity: 0.85, transform: 'rotate(-21 3 4)' }, finger);
    el('path', { d: 'M 26 70 q 16 4 28 -4', fill: 'none', stroke: skinS, 'stroke-width': 3, 'stroke-linecap': 'round' }, finger);
    const taps = o.taps;
    const tile = o.tile ?? 0;
    const need = chips.find((c) => c.n === o.need) || chips[1];
    return (lt) => {
      // screens slide left
      const k1 = CD.eio(CD.prog(lt, taps.donate + 0.12, taps.donate + 0.42));
      const k2 = CD.eio(CD.prog(lt, taps.give + 0.18, taps.give + 0.48));
      s1.setAttribute('transform', `translate(${(-332 * k1).toFixed(1)} 0)`);
      s2.setAttribute('transform', `translate(${(332 * (1 - k1) - 332 * k2).toFixed(1)} 0)`);
      s3.setAttribute('transform', `translate(${(332 * (1 - k2)).toFixed(1)} 0)`);
      const sel = lt >= taps.chip;
      chips.forEach((c) => {
        const on = c === need ? sel : c.n === 'All needs' && !sel;
        c.b.setAttribute('fill', on ? '#2e7d32' : '#ffffff');
        c.b.setAttribute('stroke', on ? '#2e7d32' : '#dbe3de');
        c.t.setAttribute('fill', on ? '#ffffff' : '#142019');
      });
      tagT.textContent = o.need;
      tiles.forEach((tl, i) => {
        const on = i === tile;
        tl.b.setAttribute('fill', on ? '#e6f1e7' : '#ffffff');
        tl.b.setAttribute('stroke', on ? '#2e7d32' : '#dbe3de');
        tl.b.setAttribute('stroke-width', on ? 3 : 1.4);
      });
      const press = (t) => 1 - 0.04 * CD.win(lt, t - 0.05, t + 0.18, 0.1);
      donateB.setAttribute('transform', `translate(166 551) scale(${press(taps.donate)}) translate(-166 -551)`);
      giveB.setAttribute('transform', `translate(166 501) scale(${press(taps.give)}) translate(-166 -501)`);
      const ok = CD.prog(lt, taps.give + 0.5, taps.give + 0.95);
      okC.setAttribute('r', (56 * CD.back(CD.prog(lt, taps.give + 0.42, taps.give + 0.8))).toFixed(2));
      okM.setAttribute('stroke-dashoffset', (90 * (1 - CD.eo(ok))).toFixed(1));

      // finger travels to each tap point
      const pts = [[need.cx, need.cy, taps.chip], [166, 551, taps.donate], [166, 501, taps.give]];
      const shown = pts.map(([x, y, t]) => [t, [x + 18, y + 26]]);
      const keys = [[0, [420, 900]], ...shown.flatMap(([t, p]) => [[t - 0.32, p], [t + 0.08, p]]), [taps.give + 0.75, [460, 980]]];
      const fp = CD.track(keys, lt, CD.sine);
      const down = Math.max(...pts.map(([, , t]) => CD.win(lt, t - 0.07, t + 0.12, 0.06)));
      finger.setAttribute('transform', `translate(${(fp[0] - 166 - 14).toFixed(1)} ${(fp[1] - 356 - 22 + down * 4).toFixed(1)}) scale(${(1 - 0.05 * down).toFixed(3)})`);
      let rp = null;
      for (const [x, y, t] of pts) if (lt >= t && lt < t + 0.45) rp = [x, y, CD.prog(lt, t, t + 0.45)];
      if (rp) { ripple.setAttribute('cx', rp[0]); ripple.setAttribute('cy', rp[1]); ripple.setAttribute('r', (8 + 40 * CD.eo(rp[2])).toFixed(1)); ripple.setAttribute('opacity', (0.35 * (1 - rp[2])).toFixed(3)); }
      else ripple.setAttribute('opacity', 0);
    };
  };
})();
