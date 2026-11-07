/* Shots shared by several versions: the donor at home with a phone, and the phone close-up. */
(function () {
  'use strict';
  const CD = window.CD;
  const { el } = CD;
  const put = (CD.put = (p, x, y, rot = 0, op = 1, s = 1) => {
    p.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${s})`);
    p.setAttribute('opacity', op.toFixed(3));
  });
  CD.shots = {
    /** A donor behind a kitchen island, reading their phone; the face moves from concern to resolve. */
    donor(person, o = {}) {
      return {
        bg: '#e6edf1',
        build(g) {
          CD.sets.home(g, { mugX: o.mugX ?? -230, window: o.window ?? -560, lampX: o.lampX ?? 260 });
          this.p = CD.person(person).place(0, 0, 1);
          g.appendChild(this.p.g);
          const isl = el('g', {}, g);
          el('rect', { x: -1600, y: -212, width: 3200, height: 18, fill: '#f3f5f4', rx: 3 }, isl);
          el('rect', { x: -1600, y: -196, width: 3200, height: 1200, fill: CD.vgrad('#355046', '#283d34') }, isl);
          const mug = CD.prop('mug', { color: '#1565c0' });
          mug.setAttribute('transform', `translate(${o.mugX ?? -230} -212) scale(1.6)`);
          isl.appendChild(mug);
          this.ph = CD.prop('phone', { screen: '#f7f9f6' });
          g.appendChild(this.ph);
        },
        update(t, lt) {
          const d = this.t1 - this.t0;
          this.a = this.a || CD.animate(this.p, [
            [0, { ex: 'calm', gy: 0.95, nod: 6, lh: [-16, -276], rh: [18, -284] }],
            [d * 0.42, { ex: 'worried', gy: 0.95, nod: 7, lh: [-16, -276], rh: [18, -284] }],
            [d * 0.8, { ex: 'hopeful', gy: 0.9, nod: 6, tilt: 3, lh: [-16, -278], rh: [18, -286] }],
            [d, { ex: 'smile', gy: 0.9, nod: 6, tilt: 3, lh: [-16, -278], rh: [18, -286] }],
          ]);
          this.a(lt, t);
          const h = this.p.handWorld('l'), h2 = this.p.handWorld('r');
          put(this.ph, (h[0] + h2[0]) / 2, (h[1] + h2[1]) / 2 - 12 + Math.sin(lt * 6) * 0.4, 0, 1, 1.3);
        },
        cam: CD.cam({ landscape: [[0, [0, -330, 400, 310]], [2.0, [0, -334, 360, 280]]], portrait: [[0, [0, -326, 320, 390]], [2.0, [0, -330, 290, 355]]] }),
      };
    },
    /** The phone close-up: choose a need, Donate, Give $10, thank you. */
    phone(o) {
      return {
        bg: '#dfe8ee',
        build(g) { this.u = CD.sets.phone(g, o); },
        update(t, lt) { this.u(lt); },
        cam: CD.cam({ landscape: [[0, [0, 30, 560, 860]], [3.2, [0, 10, 520, 800]]], portrait: [[0, [0, 40, 470, 840]], [3.2, [0, 20, 440, 790]]] }),
      };
    },
  };
})();
