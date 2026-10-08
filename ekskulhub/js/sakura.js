/* ===== Sakura: ranting, kelopak jatuh, ikon kolom, ripple ===== */
(() => {
  const rnd = (a, b) => a + Math.random() * (b - a),
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ranting */
  const br = $("#branch");
  let b =
    '<g fill="none" stroke="#6b3a40" stroke-linecap="round"><path d="M400 22C335 42 282 30 232 82 192 122 150 116 88 172" stroke-width="10"/><path d="M300 46C290 92 270 112 250 152" stroke-width="6"/><path d="M216 94C205 132 172 142 150 192" stroke-width="5"/><path d="M142 128C112 122 82 102 60 96" stroke-width="4"/></g>';
  const fl = [
    [332, 40, 1.2],
    [300, 62, 1],
    [262, 64, 1.1],
    [250, 152, 1.3],
    [226, 86, 1.25],
    [172, 126, 1],
    [150, 192, 1.15],
    [96, 166, 1.2],
    [60, 96, 1],
    [122, 124, 0.9],
    [378, 28, 0.8],
    [285, 36, 0.9],
    [200, 104, 0.8],
    [110, 150, 0.85],
  ];
  fl.forEach(([x, y, k]) => {
    const r = rnd(0, 72);
    b += `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})">`;
    for (let i = 0; i < 5; i++)
      b += `<path transform="rotate(${i * 72})" d="M0-3C-9-8-10-20-3-23L0-19 3-23C10-20 9-8 0-3Z" fill="#ffc9da" stroke="#ff8fb1" stroke-width=".7"/>`;
    b += '<circle r="3.2" fill="#e0457b"/>';
    for (let i = 0; i < 6; i++)
      b += `<circle cx="${Math.cos(i) * 5.5}" cy="${Math.sin(i) * 5.5}" r="1" fill="#f6c453"/>`;
    b += "</g>";
  });
  [
    [345, 56],
    [240, 120],
    [185, 150],
    [75, 130],
  ].forEach(
    ([x, y]) =>
      (b += `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="6.5" fill="#ff9fbf" stroke="#e0457b" stroke-width=".6"/>`),
  );
  br.innerHTML = b;

  /* kelopak jatuh */
  const cv = [$("#skB"), $("#skF")],
    cx = cv.map((c) => c.getContext("2d")),
    pal = ["#ffb7cf", "#ffc9da", "#ff9fbf", "#ffd9e6", "#f98bb0", "#ffe3ec"];
  const lo =
    (navigator.hardwareConcurrency || 8) <= 4 ||
    innerWidth < 480 ||
    (navigator.deviceMemory || 8) <= 4 ||
    !!(navigator.connection && navigator.connection.saveData);
  let W = 0,
    H = 0;
  function size() {
    const d = Math.min(devicePixelRatio || 1, lo ? 1 : 1.5);
    W = innerWidth;
    H = innerHeight;
    cv.forEach((c, i) => {
      c.width = W * d;
      c.height = H * d;
      cx[i].setTransform(d, 0, 0, d, 0, 0);
    });
  }
  size();
  addEventListener("resize", size);
  const N = reduce ? 8 : Math.min(lo ? 12 : 26, Math.round(innerWidth / 26)),
    F = 0,
    P = [];
  function spawn(p, top) {
    p.front = p.front || false;
    p.z = p.front ? rnd(1.5, 2.1) : rnd(0.35, 1.15);
    p.s = rnd(8, 15) * p.z;
    p.x = rnd(-100, W + 100);
    p.y = top ? -rnd(20, 200) : rnd(0, H);
    p.vy = rnd(0.5, 1.2) * (0.55 + p.z * 0.55) * (reduce ? 0.4 : 1);
    p.rot = rnd(0, 6.28);
    p.vr = rnd(-0.03, 0.03);
    p.fl = rnd(0, 6.28);
    p.vf = rnd(0.015, 0.045);
    p.ph = rnd(0, 6.28);
    p.sp = rnd(0.6, 1.4);
    p.c = pal[(Math.random() * pal.length) | 0];
  }
  for (let i = 0; i < N + F; i++) {
    const p = { front: i >= N };
    spawn(p, false);
    P.push(p);
  }
  let px = -999,
    py = -999,
    pvx = 0,
    wind = 0.4,
    t = 0;
  window.sakuraAt = (x, y, n, k = 1) => {
    for (let i = 0; i < n; i++) {
      const p = { front: i % 4 === 0 };
      spawn(p, false);
      p.x = x;
      p.y = y;
      if (k < 1) p.s *= 0.7;
      const a = rnd(0, 6.28),
        v = rnd(3, 11) * k + 1;
      p.bx = Math.cos(a) * v;
      p.by = Math.sin(a) * v - 3;
      p.temp = 1;
      p.life = rnd(110, 240);
      P.push(p);
    }
  };
  window.sakuraBurst = () => {
    const r = $("#idc").getBoundingClientRect();
    sakuraAt(r.left + r.width / 2, r.top + r.height / 2, 60, 1);
  };
  addEventListener(
    "pointermove",
    (e) => {
      pvx = Math.max(-14, Math.min(14, e.movementX));
      px = e.clientX;
      py = e.clientY;
    },
    { passive: true },
  );
  function petal(c, s) {
    c.beginPath();
    c.moveTo(0, s);
    c.bezierCurveTo(-s * 0.95, s * 0.5, -s * 0.85, -s * 0.8, -s * 0.14, -s);
    c.lineTo(0, -s * 0.76);
    c.lineTo(s * 0.14, -s);
    c.bezierCurveTo(s * 0.85, -s * 0.8, s * 0.95, s * 0.5, 0, s);
    c.closePath();
  }
  let _run = true,
    _on = true;
  function frame() {
    if (!_run) {
      _on = false;
      return;
    }
    t++;
    pvx *= 0.94;
    wind = 0.45 + Math.sin(t * 0.006) * 0.35 + pvx * 0.05;
    cx.forEach((c) => c.clearRect(0, 0, W, H));
    for (const p of P) {
      if (p.temp) {
        p.x += p.bx;
        p.y += p.by;
        p.bx *= 0.955;
        p.by = p.by * 0.955 + 0.09;
        p.rot += p.vr * 2;
        p.fl += p.vf;
        if (--p.life <= 0) {
          P.splice(P.indexOf(p), 1);
          continue;
        }
      } else {
        p.y += p.vy;
        p.x += wind * p.z * 1.4 + Math.sin(t * 0.02 * p.sp + p.ph) * 0.7 * p.z;
      }
      {
        if (!p.temp) {
          p.rot += p.vr + wind * 0.004;
          p.fl += p.vf;
        }
        const dx = p.x - px,
          dy = p.y - py,
          d = Math.hypot(dx, dy);
        if (d < 130 && !p.front) {
          const f = (130 - d) / 130;
          p.x += (dx / d) * f * 3.5;
          p.y += (dy / d) * f * 1.5;
          p.rot += f * 0.08;
        }
        if (!p.temp && (p.y > H + 40 || p.x > W + 160 || p.x < -200)) spawn(p, true);
        const c = cx[p.front ? 1 : 0],
          k = Math.cos(p.fl),
          sc = 0.3 + 0.7 * Math.abs(k);
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.scale(sc, 1);
        c.globalAlpha =
          (p.front ? 0.55 : Math.min(1, 0.4 + p.z * 0.55)) * (0.65 + 0.35 * Math.abs(k));
        c.fillStyle = p.c;
        petal(c, p.s);
        c.fill();
        c.globalAlpha *= 0.55;
        c.fillStyle = k > 0 ? "#fff" : "#ff7fa8";
        c.beginPath();
        c.ellipse(0, p.s * 0.45, p.s * 0.3, p.s * 0.4, 0, 0, 6.28);
        c.fill();
        c.restore();
      }
    }
    if (window.__trail) window.__trail(cx[1]);
    requestAnimationFrame(frame);
  }
  frame();
  window.__sakuraSet = (v) => {
    _run = v;
    if (!v) cx.forEach((c) => c.clearRect(0, 0, W, H));
    else if (!_on) {
      _on = true;
      requestAnimationFrame(frame);
    }
  };

  /* ikon di kolom */
  const IC = {
    rN: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
    rE: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 8l9 6 9-6"/>',
    rP: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    rC: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3M9.5 16l2 2 3.5-3.5"/>',
    rK: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  };
  for (const id in IC) {
    const r = $("#" + id);
    if (r)
      r.insertAdjacentHTML(
        "afterbegin",
        `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[id]}</svg>`,
      );
  }

  /* ripple ala aplikasi */
  $("#go").addEventListener("pointerdown", (e) => {
    const b = e.currentTarget,
      r = b.getBoundingClientRect(),
      s = document.createElement("span"),
      z = Math.max(r.width, r.height) / 3;
    s.className = "rip";
    s.style.cssText = `width:${z}px;height:${z}px;left:${e.clientX - r.left - z / 2}px;top:${e.clientY - r.top - z / 2}px`;
    b.appendChild(s);
    setTimeout(() => s.remove(), 650);
    if (navigator.vibrate) navigator.vibrate(8);
  });
})();
