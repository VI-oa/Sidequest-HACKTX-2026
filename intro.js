/* Sidequest connection intro. Original particle artwork, second half only (9s–17.8s), played in 3s. */
(() => {
  'use strict';
  const script = document.currentScript;
  const configured = Number(script?.dataset.duration);
  const duration = Number.isFinite(configured) && configured >= 1000 ? configured : 3000;
  const once = script?.dataset.once === 'session';
  function start() {
    if (document.getElementById('sidequest-intro')) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seenKey = 'sidequest-connection-intro-seen';
    if (once) { try { if (sessionStorage.getItem(seenKey)) return; } catch {} }
    // Honor reduced motion without making the visitor wait behind a still screen.
    if (reduced.matches) return;
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.id = 'sidequest-intro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Sidequest introduction');
    overlay.innerHTML = '<canvas aria-hidden="true"></canvas><div class="sq-intro-heading"><strong>sidequest</strong><span>Quests are better together.</span></div><button class="sq-intro-skip" type="button">Skip intro <span aria-hidden="true">↗</span></button>';
    document.body.appendChild(overlay);
    const cv = overlay.querySelector('canvas');
    const skip = overlay.querySelector('button');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const covered = [...document.body.children].filter(el => el !== overlay).map(el => ({el, inert: el.inert}));
    covered.forEach(({el}) => { el.inert = true; });
    skip.focus({preventScroll: true});
    let raf = 0, finished = false, finishTimer = 0, removeTimer = 0;
    let observer;
    const remove = () => {
      overlay.remove();
      document.body.style.overflow = previousOverflow;
      covered.forEach(({el, inert}) => { el.inert = inert; });
      observer?.disconnect();
      const focusTarget = previousFocus && previousFocus !== document.body && previousFocus.isConnected
        ? previousFocus : document.querySelector('main a, main button, main input, header a');
      focusTarget?.focus({preventScroll: true});
      document.dispatchEvent(new CustomEvent('sidequest:intro-complete'));
    };
    function finish(immediate = false) {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      clearTimeout(finishTimer);
      document.removeEventListener('keydown', onKey);
      reduced.removeEventListener('change', onMotion);
      if (once) { try { sessionStorage.setItem(seenKey, '1'); } catch {} }
      if (immediate) remove();
      else { overlay.classList.add('sq-intro-exit'); removeTimer = setTimeout(remove, 240); }
    }
    function onKey(e) { if (e.key === 'Escape') finish(true); }
    function onMotion(e) { if (e.matches) finish(true); }
    document.addEventListener('keydown', onKey);
    reduced.addEventListener('change', onMotion);
    skip.addEventListener('click', () => finish(true));
    // Keep new top-level page content out of the keyboard path during the intro.
    observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(el => {
      if (el.nodeType === 1 && el !== overlay) { covered.push({el, inert: el.inert}); el.inert = true; }
    })));
    observer.observe(document.body, {childList: true});
    
    finishTimer = setTimeout(() => finish(false), Math.max(0, duration - 240));
    try {
    const W = 1120, HH = 640, BG = '#05060a';

    const displayScale = Math.min(
      window.innerWidth / W,
      window.innerHeight / HH
    );

    // Draw extra pixels so enlarged artwork stays sharper.
    const dpr = Math.min(
      4,
      Math.max(1, displayScale * (window.devicePixelRatio || 1))
    );
    cv.width = W * dpr; cv.height = HH * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let seed = 20261024;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let q = Math.imul(seed ^ seed >>> 15, 1 | seed); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

    const MX = 560;
    const g = (x) => 446 + 9 * Math.sin(x * 0.006 + 1.0) + 6 * Math.sin(x * 0.017 + 0.5);
        const RING_Y = g(MX) + 14;

    // ---------- terrain
    const LAY = [
      { f: (x, t) => 250 + 125 * (x / W) + 7 * Math.sin(x * 0.012 + t * 0.12), n: 1500, sp: 70, br: 0.5 },
      { f: (x, t) => 345 + 18 * Math.sin(x * 0.007 + 2 + t * 0.15) + 9 * Math.sin(x * 0.019 + t * 0.2), n: 1200, sp: 40, br: 0.55 },
      { f: (x, t) => 392 + 14 * Math.sin(x * 0.006 + 0.5 + t * 0.12) + 7 * Math.sin(x * 0.02 + 1 + t * 0.18), n: 1300, sp: 42, br: 0.65 },
      { f: (x, t) => g(x), n: 2300, sp: 36, br: 0.9 },
      { f: (x, t) => 520 + 16 * Math.sin(x * 0.005 + 3 + t * 0.2) + 8 * Math.sin(x * 0.016 + t * 0.25), n: 1200, sp: 50, br: 0.8 },
      { f: (x, t) => 580 + 14 * Math.sin(x * 0.007 + 1 + t * 0.22) + 6 * Math.sin(x * 0.02 + t * 0.3), n: 800, sp: 60, br: 0.7 }
    ];
    LAY.forEach((L) => {
      L.ps = [];
      for (let i = 0; i < L.n; i++) {
        const x = rnd() * W;
        let d = -Math.log(1 - rnd()) * L.sp;
        let edge = false;
        if (rnd() < 0.42) { const step = L.sp * 0.42; d = Math.round(d / step) * step + (rnd() - 0.5) * 3; }
        if (rnd() < 0.1) { d = (rnd() - 0.5) * 3; edge = true; }
        const fall = edge ? 1 : Math.exp(-Math.max(d, 0) / (L.sp * 0.7));
        L.ps.push({ x: x, d: d, s: 0.8 + rnd() * 0.9, a: (0.45 + 0.55 * rnd()) * fall * L.br * (edge ? 1.7 : 1), ph: rnd() * 6.28, sp: 1 + rnd() * 3 });
      }
    });

    // ---------- sky + dust
    const stars = [];
    for (let i = 0; i < 320; i++) { stars.push({ x: rnd() * W, y: rnd() * 330, s: 0.7 + rnd() * 1.1, a: 0.2 + 0.7 * rnd(), ph: rnd() * 6.28, sp: 0.8 + rnd() * 2.5 }); }
    const dust = [];
    for (let i = 0; i < 150; i++) { dust.push({ x: rnd() * W, y: 120 + rnd() * 380, vx: 4 + rnd() * 10, s: 0.8 + rnd() * 0.8, a: 0.12 + rnd() * 0.25, ph: rnd() * 6.28 }); }

    // ---------- soul circles
    const NS = 6, CX = 560, CY = 250, RX = 270, RY = 95;
    const TINT = [[200, 224, 255], [255, 228, 192], [255, 208, 220], [205, 255, 230], [224, 210, 255], [255, 242, 180]];
    const WARM = [255, 236, 205];
    const mix = (a, b, k) => 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
    const makeOrb = (n) => {
      const ps = [];
      for (let k = 0; k < n; k++) {
        const z = rnd() * 2 - 1, th = rnd() * 6.2832, rr = Math.sqrt(1 - z * z);
        const rad = rnd() < 0.55 ? 0.9 + 0.1 * rnd() : Math.cbrt(rnd()) * 0.9;
        ps.push({ x: rr * Math.cos(th) * rad, y: rr * Math.sin(th) * rad, z: z * rad, rad: rad, a: 0.5 + 0.5 * rnd(), s: 0.8 + rnd() * 0.9, ph: rnd() * 6.28, sp: 1 + rnd() * 3, dx: (rnd() - 0.5) * 220, dy: -(40 + rnd() * 200) });
      }
      return ps;
    };
    const souls = [];
    for (let i = 0; i < NS; i++) {
      souls.push({ R: 34 + rnd() * 12, ps: makeOrb(1100), ph: rnd() * 6.28, spin: 0.35 + rnd() * 0.4, tilt: 0.3 + rnd() * 0.5, p0x: 130 + rnd() * 860, p0y: 110 + rnd() * 270, w0: rnd() * 6.28, w1: rnd() * 6.28, tint: TINT[i] });
    }
    const core = { R: 20, ps: makeOrb(600), ph: 1.1, spin: 0.9, tilt: 0.5, tint: WARM };

    const LINKS = [];
    for (let k = 0; k < 6; k++) { LINKS.push({ a: k, b: (k + 1) % 6, start: 4.8 + k * 0.7, bend: (k % 2 ? 1 : -1) * 0.9 }); }
    [[0, 3], [1, 4], [2, 5]].forEach((p, i) => { LINKS.push({ a: p[0], b: p[1], start: 8.8 + i * 0.5, bend: 0 }); });
    LINKS.forEach((L) => {
      L.ps = [];
      for (let i = 0; i < 120; i++) { L.ps.push({ u0: rnd(), w: rnd() * 2 - 1, a: 0.5 + 0.5 * rnd(), ph: rnd() * 6.28, s: 0.8 + rnd() * 0.9 }); }
    });

    const beam = [];
    for (let i = 0; i < 150; i++) { beam.push({ u: rnd(), w: rnd() * 2 - 1, s: 0.8 + rnd() * 0.8, a: 0.4 + 0.6 * rnd() }); }
    const ringAng = [];
    for (let i = 0; i < 240; i++) { ringAng.push({ a: rnd() * 6.2832, j: (rnd() - 0.5) * 6, s: 0.8 + rnd() * 0.9 }); }
    const sparks = [];
    for (let i = 0; i < 70; i++) { sparks.push({ a: rnd(), b: rnd() }); }

    const drawOrb = (sl, S, t, ds, haloK) => {
      const ang = t * sl.spin + sl.ph;
      const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(sl.tilt), st = Math.sin(sl.tilt);
      const rad = S.R * S.sc;
      ctx.globalAlpha = 0.55 * (1 - ds); ctx.fillStyle = BG;
      ctx.beginPath(); ctx.arc(S.cx, S.cy, rad * 0.97, 0, 6.2832); ctx.fill();
      const col = mix(sl.tint, WARM, S.conn * 0.65);
      const rgb = col.slice(4, col.length - 1);
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(S.cx, S.cy, rad * 0.6, S.cx, S.cy, rad * haloK);
      gr.addColorStop(0, 'rgba(' + rgb + ',' + ((0.14 + 0.24 * S.conn) * (1 - ds)).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.globalAlpha = 1; ctx.fillStyle = gr;
      ctx.fillRect(S.cx - rad * haloK, S.cy - rad * haloK, rad * haloK * 2, rad * haloK * 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = col;
      const kk = ds * ds;
      for (let i = 0; i < sl.ps.length; i++) {
        const p = sl.ps[i];
        const x1 = p.x * ca + p.z * sa, z1 = -p.x * sa + p.z * ca;
        const y2 = p.y * ct - z1 * st, z2 = p.y * st + z1 * ct;
        const rim = 1 - Math.abs(z2);
        const lit = 0.5 + 0.5 * z2;
        const a = p.a * (0.28 + 0.5 * lit + 0.7 * rim * rim * (0.3 + 0.7 * p.rad)) * S.bright * (0.92 + 0.08 * S.pulse) * (1 - ds);
        if (a < 0.02) { continue; }
        let x = S.cx + x1 * rad + Math.sin(t * p.sp + p.ph) * 0.6;
        let y = S.cy + y2 * rad + Math.cos(t * p.sp * 0.8 + p.ph) * 0.6;
        if (ds > 0) { x += p.dx * kk; y += p.dy * kk; }
        ctx.globalAlpha = a > 1 ? 1 : a;
        ctx.fillRect(x, y, p.s, p.s);
      }
    };

    const draw = (t) => {
      const form = ease((t - 1.4) / 3.4);
      const rot = 0.13 * Math.max(0, t - 6);
      const ds = t < 1.5 ? 1 - ease(t / 1.5) : (t > 15.5 ? ease((t - 15.5) / 2.0) : 0);
      const syncAll = ease((t - 10.2) / 1.5);
      const coreP = ease((t - 10.2) / 1.6);
      const tm = t - 10.6;

      // link strengths -> per-soul connectedness
      const sumS = [0, 0, 0, 0, 0, 0];
      LINKS.forEach((L) => { L.s = ease((t - L.start) / 1.2); sumS[L.a] += L.s; sumS[L.b] += L.s; });

      // soul states
      const S = souls.map((sl, i) => {
        const th = Math.PI * 2 * i / NS + rot;
        const fx = CX + RX * Math.cos(th), fy = CY + RY * Math.sin(th) + 5 * Math.sin(t * 0.9 + sl.ph);
        const wx = sl.p0x + 45 * Math.sin(t * 0.5 + sl.w0), wy = sl.p0y + 32 * Math.cos(t * 0.42 + sl.w1);
        const z = Math.sin(th) * form;
        const conn = clamp(sumS[i] / 3, 0, 1);
        const pulse = Math.sin(t * 1.8 + sl.ph * (1 - syncAll));
        return { cx: wx + (fx - wx) * form, cy: wy + (fy - wy) * form, z: z, sc: (1 + 0.16 * z) * (1 + 0.04 * pulse), R: sl.R, conn: conn, bright: 0.42 + 0.55 * conn, pulse: pulse };
      });

      const rings = [];
      for (let k = 0; k < 4; k++) {
        const R = (t - (10.6 + k * 1.4)) * 95;
        if (R > 0 && R < 600) { rings.push({ R: R, f: (1 - R / 600) * (1 - ds) }); }
      }

      ctx.globalAlpha = 1; ctx.fillStyle = BG; ctx.fillRect(0, 0, W, HH);

      ctx.fillStyle = '#dfe6f5';
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }

      const drawLayer = (L) => {
        ctx.globalAlpha = 1; ctx.fillStyle = BG;
        ctx.beginPath(); ctx.moveTo(0, HH);
        for (let x = 0; x <= W; x += 8) { ctx.lineTo(x, L.f(x, t)); }
        ctx.lineTo(W, HH); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#eef2fb';
        for (let i = 0; i < L.ps.length; i++) {
          const p = L.ps[i];
          const y = L.f(p.x, t) + p.d;
          if (y > HH) { continue; }
          let a = p.a * (0.75 + 0.25 * Math.sin(t * p.sp + p.ph));
          for (let k = 0; k < rings.length; k++) {
            const dd = Math.sqrt((p.x - MX) * (p.x - MX) + ((y - RING_Y) / 0.22) * ((y - RING_Y) / 0.22));
            const dl = dd - rings[k].R;
            if (dl > -150 && dl < 150) { a += Math.exp(-(dl / 45) * (dl / 45)) * 0.9 * rings[k].f; }
          }
          if (a < 0.02) { continue; }
          ctx.globalAlpha = a > 1 ? 1 : a;
          ctx.fillRect(p.x, y, p.s, p.s);
        }
      };
      for (let i = 0; i <= 3; i++) { drawLayer(LAY[i]); }

      ctx.fillStyle = '#cfd8ea';
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        ctx.globalAlpha = d.a * (1 - ds * 0.5);
        ctx.fillRect(((d.x + t * d.vx) % W + W) % W, d.y + Math.sin(t * 0.5 + d.ph) * 8, d.s, d.s);
      }

      // ground ripples
      ctx.fillStyle = '#ffe9c8';
      for (let k = 0; k < rings.length; k++) {
        const rg = rings[k];
        for (let i = 0; i < ringAng.length; i++) {
          const q = ringAng[i];
          ctx.globalAlpha = clamp(rg.f * 0.9, 0, 1);
          ctx.fillRect(MX + (rg.R + q.j) * Math.cos(q.a), RING_Y + (rg.R + q.j) * 0.22 * Math.sin(q.a), q.s, q.s);
        }
      }

      // light pillar from the core down to the dunes
      if (coreP > 0) {
        ctx.fillStyle = '#ffe2b4';
        const cyN = S[0].cy * 0 + CY;
        for (let i = 0; i < beam.length; i++) {
          const b = beam[i];
          const v = (b.u + t * 0.3) % 1;
          const y = cyN + v * (RING_Y - cyN);
          ctx.globalAlpha = 0.55 * Math.sin(Math.PI * v) * b.a * coreP * (1 - ds);
          ctx.fillRect(MX + b.w * (4 + 6 * v) + Math.sin(t * 2 + b.u * 9) * 1.5, y, b.s, b.s);
        }
      }

      // links
      LINKS.forEach((L) => {
        if (L.s <= 0) { return; }
        const A = S[L.a], B = S[L.b];
        const dx = B.cx - A.cx, dy = B.cy - A.cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist, uy = dy / dist;
        const p0x = A.cx + ux * A.R * A.sc * 0.9, p0y = A.cy + uy * A.R * A.sc * 0.9;
        const p2x = B.cx - ux * B.R * B.sc * 0.9, p2y = B.cy - uy * B.R * B.sc * 0.9;
        const bend = L.bend * dist * 0.22;
        const qx = (p0x + p2x) / 2 - uy * bend, qy = (p0y + p2y) / 2 + ux * bend;
        const grow = L.s;
        ctx.fillStyle = '#ffe6c2';
        for (let i = 0; i < L.ps.length; i++) {
          const p = L.ps[i];
          const u = (p.u0 + t * 0.25) % 1;
          if (u > grow) { continue; }
          const om = 1 - u;
          const off = (p.w * 7 * Math.pow(Math.sin(Math.PI * u), 0.7) + Math.sin(t * 3 + p.ph) * 1.2);
          const x = om * om * p0x + 2 * om * u * qx + u * u * p2x - uy * off;
          const y = om * om * p0y + 2 * om * u * qy + u * u * p2y + ux * off;
          ctx.globalAlpha = (0.3 + 0.7 * Math.sin(Math.PI * u)) * p.a * (1 - ds) * 0.9;
          ctx.fillRect(x, y, p.s, p.s);
        }
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 3; k++) {
          const u = (t * 0.3 + k / 3) % 1;
          if (u > grow) { continue; }
          const om = 1 - u;
          ctx.globalAlpha = 0.95 * (1 - ds);
          ctx.fillRect(om * om * p0x + 2 * om * u * qx + u * u * p2x - 1.3, om * om * p0y + 2 * om * u * qy + u * u * p2y - 1.3, 2.6, 2.6);
        }
        const tb = t - (L.start + 1.2);
        if (tb > 0 && tb < 1.4) {
          const rr = B.R * B.sc + ease(tb / 1.4) * 60;
          ctx.fillStyle = '#ffe6c2';
          ctx.globalAlpha = (1 - tb / 1.4) * 0.75 * (1 - ds);
          for (let i = 0; i < 40; i++) {
            const a = i / 40 * 6.2832 + L.start;
            ctx.fillRect(B.cx + rr * Math.cos(a), B.cy + rr * Math.sin(a), 1.4, 1.4);
          }
        }
      });

      // souls, back to front
      const order = S.map((s, i) => i).sort((p, q) => S[p].z - S[q].z);
      order.forEach((i) => { drawOrb(souls[i], S[i], t, ds, 2.6); });

      // core bloom + rising sparks
      if (coreP > 0) {
        const cp = Math.sin(t * 1.8);
        drawOrb(core, { cx: CX, cy: CY, sc: coreP * (1 + 0.08 * cp), R: core.R, conn: 1, bright: 1, pulse: cp }, t, ds, 4.2);
        if (tm > 0) {
          ctx.fillStyle = '#ffdca8';
          for (let i = 0; i < sparks.length; i++) {
            const sp = sparks[i];
            const life = (t * 0.4 + sp.a * 5) % 1;
            ctx.globalAlpha = Math.sin(Math.PI * life) * clamp(tm / 1.0, 0, 1) * (1 - ds);
            ctx.fillRect(CX + (sp.b - 0.5) * 50 + Math.sin(t + sp.a * 20) * 14 * life, CY - 20 - life * 120 * (0.5 + sp.b * 0.8), 1.7, 1.7);
          }
        }
      }
      ctx.globalAlpha = 1;
    };


      const started = performance.now();
      const frame = now => {
        if (finished) return;
        const elapsed = now - started;
        // Start halfway through: connections, core bloom, ripples, then dissolve.
        const timeline = Math.min(9 + elapsed / Math.max(1, duration - 240) * 8.8, 17.8);
        draw(timeline);
        raf = requestAnimationFrame(frame);
      };
      draw(9);
      raf = requestAnimationFrame(frame);
    } catch (error) {
      console.error('Sidequest intro could not render:', error);
      finish(true);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
