/* ===== Kartu: flip, QR, sparkle, cincin progres, gyro, ledakan sakura ===== */
(() => {
  const inner = $("#inner"),
    scene = $("#scene"),
    fbg = document.querySelector(".front .fbg");
  for (let i = 0; i < 3; i++) {
    const k = document.createElement("i");
    k.className = "spk";
    k.style.cssText = `left:${6 + Math.random() * 88}%;top:${6 + Math.random() * 88}%;animation-delay:${Math.random() * 2.6}s;animation-duration:${2 + Math.random() * 2}s`;
    fbg.appendChild(k);
  }
  /* balik kartu */
  let down = null;
  scene.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  scene.addEventListener("pointerup", (e) => {
    if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 8) {
      inner.classList.toggle("flip");
      say(
        inner.classList.contains("flip")
          ? "Ini sisi belakang. QR-nya unik buatmu!"
          : "Kartunya kembali ke depan.",
      );
      jump();
    }
    down = null;
  });
  scene.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inner.classList.toggle("flip");
    }
  });
  /* QR dekoratif dari nama+email+ekskul */
  function qr() {
    let h = hash(f.n.value + f.e.value + f.k.value) || 1,
      o = "",
      n = 21;
    const fin = (x, y) =>
      [
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].some(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
    const fp = (x, y) => {
      for (const [a, b] of [
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ])
        if (x >= a && x < a + 7 && y >= b && y < b + 7) {
          const dx = x - a,
            dy = y - b;
          return (
            dx == 0 || dx == 6 || dy == 0 || dy == 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
          );
        }
    };
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        h = (h * 1664525 + 1013904223) >>> 0;
        if (fin(x, y) ? fp(x, y) : h >>> 29 < 3)
          o += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
      }
    $("#qr").innerHTML =
      `<svg viewBox="0 0 ${n} ${n}" fill="#2a0f25" shape-rendering="crispEdges">${o}</svg>`;
    $("#bNm").textContent = $("#cNm").textContent;
    $("#bNo").textContent = $("#cNo").textContent;
  }
  const _b = barcode;
  barcode = function () {
    _b();
    qr();
  };
  barcode();
  /* cincin progres di foto */
  const _p = progress;
  progress = function () {
    const n = _p();
    idc.style.setProperty("--p", (n * 100) / TOTAL + "%");
    return n;
  };
  progress();
  /* watermark emoji ekskul */
  f.k.addEventListener("change", () => {
    const w = $("#cWm");
    w.textContent = EK[f.k.value][0];
    w.style.transform = "scale(1.3) rotate(-10deg)";
    setTimeout(() => (w.style.transform = ""), 400);
  });
  panel.addEventListener("reset", () =>
    setTimeout(() => {
      $("#cWm").textContent = "🌸";
      inner.classList.remove("flip");
    }, 0),
  );
  /* spotlight panel & animasi masuk berurutan */
  panel.addEventListener("pointermove", (e) => {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty("--px", e.clientX - r.left + "px");
    panel.style.setProperty("--py", e.clientY - r.top + "px");
  });
  [...panel.children].forEach((c, i) => c.style.setProperty("--i", i));
  /* gyro di HP: kartu ikut miring */
  function gyro(e) {
    if (e.gamma == null) return;
    const x = Math.max(-1, Math.min(1, e.gamma / 30)),
      y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    window.__g = { x, y };
    window.__gt = performance.now();
  }
  if (matchMedia("(hover:none)").matches && window.DeviceOrientationEvent) {
    if (DeviceOrientationEvent.requestPermission)
      scene.addEventListener(
        "click",
        () => {
          DeviceOrientationEvent.requestPermission()
            .then((r) => {
              if (r === "granted") addEventListener("deviceorientation", gyro);
            })
            .catch(() => {});
        },
        { once: true },
      );
    else addEventListener("deviceorientation", gyro);
  }
  /* ledakan kelopak saat TERDAFTAR */
  new MutationObserver(() => {
    if (scene.classList.contains("done")) window.sakuraBurst && window.sakuraBurst();
  }).observe(scene, { attributes: true, attributeFilter: ["class"] });
})();
