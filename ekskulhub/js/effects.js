/* ===== Efek halus: tilt lerp, jejak kursor, klik sakura, tombol magnetik ===== */
(() => {
  const idc = $("#idc"),
    sc = $("#scene"),
    go = $("#go"),
    rnd = (a, b) => a + Math.random() * (b - a);
  let tx = 0,
    ty = 0,
    cxp = 0,
    cyp = 0,
    hx = 30,
    hy = 20,
    thx = 30,
    thy = 20,
    last = 0;
  addEventListener(
    "pointermove",
    (e) => {
      last = performance.now();
      const r = sc.getBoundingClientRect(),
        px = (e.clientX - r.left) / r.width,
        py = (e.clientY - r.top) / r.height,
        d = Math.hypot(px - 0.5, (py - 0.5) * 0.8),
        near = Math.max(0, Math.min(1, 1.6 - d * 1.3));
      tx = Math.max(-1, Math.min(1, (px - 0.5) * 2)) * near;
      ty = Math.max(-1, Math.min(1, (py - 0.5) * 2)) * near;
      thx = px * 100;
      thy = py * 100;
    },
    { passive: true },
  );
  (function loop() {
    const t = performance.now();
    let gx = tx,
      gy = ty;
    if (window.__g && t - window.__gt < 1500) {
      gx = window.__g.x;
      gy = window.__g.y;
      thx = 50 + gx * 40;
      thy = 50 + gy * 40;
    } else if (t - last > 2500) {
      gx = Math.sin(t / 1700) * 0.55;
      gy = Math.cos(t / 2300) * 0.4;
      thx = 50 + gx * 45;
      thy = 50 + gy * 45;
    }
    cxp += (gx - cxp) * 0.075;
    cyp += (gy - cyp) * 0.075;
    hx += (thx - hx) * 0.09;
    hy += (thy - hy) * 0.09;
    idc.style.transform = `rotateY(${(cxp * 15).toFixed(2)}deg) rotateX(${(-cyp * 12).toFixed(2)}deg)`;
    idc.style.setProperty("--hx", hx.toFixed(1) + "%");
    idc.style.setProperty("--hy", hy.toFixed(1) + "%");
    requestAnimationFrame(loop);
  })();
  /* jejak kilau kursor */
  const tr = [];
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      tr.push({
        x: e.clientX,
        y: e.clientY,
        l: 1,
        vx: rnd(-0.5, 0.5),
        vy: rnd(0.2, 0.9),
        s: rnd(2, 4.6),
        h: Math.random() < 0.5 ? "#fff" : "#ff8fb4",
      });
      if (tr.length > 56) tr.shift();
    },
    { passive: true },
  );
  window.__trail = (c) => {
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let i = tr.length - 1; i >= 0; i--) {
      const p = tr[i];
      p.l -= 0.026;
      if (p.l <= 0) {
        tr.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      c.globalAlpha = p.l * 0.85;
      c.fillStyle = p.h;
      c.beginPath();
      c.arc(p.x, p.y, p.s * p.l + 0.5, 0, 6.28);
      c.fill();
    }
    c.restore();
  };
  /* klik = semburan kelopak kecil */
  addEventListener("pointerdown", (e) => {
    if (e.target.closest && e.target.closest("input,select,textarea,#cbPanel,#cbFab,#cbTease"))
      return;
    if (window.sakuraAt) sakuraAt(e.clientX, e.clientY, 9, 0.55);
  });
  /* tombol magnetik */
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      const r = go.getBoundingClientRect(),
        dx = e.clientX - (r.left + r.width / 2),
        dy = e.clientY - (r.top + r.height / 2);
      go.style.transform =
        Math.hypot(dx, dy) < 150 && !go.classList.contains("done")
          ? `translate(${(dx * 0.07).toFixed(1)}px,${(dy * 0.16).toFixed(1)}px)`
          : "";
    },
    { passive: true },
  );
  go.addEventListener("pointerdown", () => (go.style.transform = "scale(.97)"));
  /* asisten: label jujur bila di luar claude.ai */
  if (typeof claude === "undefined") {
    const w = document.querySelector(".cb-pw");
    if (w) w.textContent = "Asisten otomatis EkskulHub · jawaban dasar";
  }
})();
