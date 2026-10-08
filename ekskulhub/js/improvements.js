/* improvements.js — lite mode, new fields, draft auto-save, card download, chat modal handling */
(() => {
  const LS = "ekskulhub:draft:v1",
    FXK = "ekskulhub:fx",
    scene = $("#scene"),
    save = $("#save"),
    note = $("#draftNote");
  const store = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
    del: (k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
  };

  /* effects: auto lite on weak devices, user toggle persisted, pause when tab hidden */
  const auto =
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    (navigator.hardwareConcurrency || 8) <= 4 ||
    (navigator.deviceMemory || 8) <= 4 ||
    !!(navigator.connection && navigator.connection.saveData);
  let lite = store.get(FXK) ? store.get(FXK) === "lite" : auto;
  const fxb = $("#fxBtn");
  const applyFx = () => {
    root.dataset.fx = lite ? "lite" : "full";
    fxb.setAttribute("aria-pressed", lite);
    fxb.textContent = lite ? "🍃" : "🌸";
    fxb.title = lite ? "Mode hemat: aktif" : "Mode hemat: mati";
    window.__trail = lite ? null : window.__trail;
    window.__sakuraSet && __sakuraSet(!lite && !document.hidden);
  };
  fxb.addEventListener("click", () => {
    lite = !lite;
    store.set(FXK, lite ? "lite" : "full");
    applyFx();
    say(lite ? "Mode hemat aktif. Efek berat kumatikan." : "Efek penuh nyala lagi!");
  });
  document.addEventListener(
    "visibilitychange",
    () => window.__sakuraSet && __sakuraSet(!lite && !document.hidden),
  );
  const trail = window.__trail;
  window.__trail = lite ? null : trail;
  applyFx();
  window.__trail = lite ? null : trail;
  fxb.addEventListener("click", () => {
    window.__trail = lite ? null : trail;
  });

  /* new fields: kelas + WhatsApp */
  const ico = (id, p) => {
    const r = $("#" + id);
    r &&
      r.insertAdjacentHTML(
        "afterbegin",
        `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`,
      );
  };
  ico("rL", '<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c2.5 2 7.5 2 10 0v-5"/>');
  ico(
    "rW",
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
  );
  f.l.addEventListener("change", () => {
    mark("#rL", "#hL", true);
    $("#bKl").textContent = "Kelas " + f.l.value;
    mo("happy");
    say("Kelas " + f.l.value + " tercatat!");
    barcode();
    progress();
  });
  f.w.addEventListener("input", () => {
    const v = f.w.value,
      ok = waOk(v);
    mark("#rW", "#hW", ok, v ? (ok ? "Nomor valid" : "Contoh: 0812 3456 7890") : "", ok);
    mo(ok ? "happy" : "type");
    say(ok ? "Nomornya dipakai untuk grup ekskul." : "Nomor WhatsApp-nya lagi diketik, ya?");
    progress();
  });

  /* draft auto-save (password is never stored) */
  let tm;
  const persist = () => {
    clearTimeout(tm);
    tm = setTimeout(() => {
      if (scene.classList.contains("done")) return;
      const d = {
        n: f.n.value,
        l: f.l.value,
        e: f.e.value,
        w: f.w.value,
        k: f.k.value,
        t: Date.now(),
      };
      [d.n, d.l, d.e, d.w, d.k].some(Boolean) ? store.set(LS, JSON.stringify(d)) : store.del(LS);
    }, 300);
  };
  panel.addEventListener("input", persist);
  panel.addEventListener("change", persist);
  const has = (s, v) => [...s.options].some((o) => o.value === v && v);
  try {
    const d = JSON.parse(store.get(LS) || "null");
    if (d && Date.now() - d.t < 6048e5) {
      if (d.n) {
        f.n.value = d.n;
        f.n.dispatchEvent(new Event("input"));
      }
      if (has(f.l, d.l)) {
        f.l.value = d.l;
        f.l.dispatchEvent(new Event("change"));
      }
      if (d.e) {
        f.e.value = d.e;
        f.e.dispatchEvent(new Event("input"));
      }
      if (d.w) {
        f.w.value = d.w;
        f.w.dispatchEvent(new Event("input"));
      }
      if (has(f.k, d.k)) {
        f.k.value = d.k;
        f.k.dispatchEvent(new Event("change"));
      }
      note.hidden = false;
      setTimeout(() => {
        mo("idle");
        say("Draf tadi kupulihkan. Password ketik ulang ya.");
      }, 400);
    }
  } catch (e) {}
  $("#draftClr").addEventListener("click", () => {
    store.del(LS);
    panel.reset();
  });
  panel.addEventListener("reset", () => {
    store.del(LS);
    note.hidden = true;
    save.hidden = true;
    $("#bKl").textContent = "";
  });
  new MutationObserver(() => {
    const d = scene.classList.contains("done");
    save.hidden = !d;
    if (d) {
      store.del(LS);
      note.hidden = true;
    }
  }).observe(scene, { attributes: true, attributeFilter: ["class"] });

  /* download card as PNG (front + back); share sheet on touch devices so it can go to the gallery */
  const cs = (n) => getComputedStyle(idc).getPropertyValue(n).trim();
  function fit(c, t, w, px, wt) {
    let s = px;
    do {
      c.font = `${wt} ${s}px 'Segoe UI',system-ui,sans-serif`;
      s -= 2;
    } while (c.measureText(t).width > w && s > 14);
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
  }
  function face(c, x, y, w, h, back) {
    const u = w / 24,
      c1 = cs("--c1") || "#e0457b",
      c2 = cs("--c2") || "#ff9ab8";
    c.save();
    rr(c, x, y, w, h, u * 1.5);
    c.clip();
    const g = c.createLinearGradient(x, y, x + w, y + h);
    if (back) {
      g.addColorStop(0, "#3a1535");
      g.addColorStop(0.6, "#6a2250");
      g.addColorStop(1, c1);
    } else {
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
    }
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.fillStyle = "#fff";
    c.textBaseline = "alphabetic";
    const nm = f.n.value.trim() || "Nama Lengkapmu",
      no = $("#cNo").textContent,
      kl = f.l.value ? "Kelas " + f.l.value : "";
    if (back) {
      c.fillStyle = "#140a14";
      c.fillRect(x, y + u * 1.6, w, u * 2.8);
      const q = u * 6.6,
        qx = x + u * 1.3,
        qy = y + u * 5.6;
      c.fillStyle = "#fff";
      rr(c, qx, qy, q, q, u * 0.8);
      c.fill();
      c.fillStyle = "#2a0f25";
      const s = (q - u * 0.8) / 21;
      $("#qr")
        .querySelectorAll("rect")
        .forEach((r) =>
          c.fillRect(
            qx + u * 0.4 + r.getAttribute("x") * s,
            qy + u * 0.4 + r.getAttribute("y") * s,
            s * 1.02,
            s * 1.02,
          ),
        );
      c.fillStyle = "#fff";
      const tx = qx + q + u,
        mw = w - q - u * 3.6;
      fit(c, nm, mw, u * 1.1, 800);
      c.fillText(nm, tx, qy + u * 1.2);
      c.font = `700 ${u * 0.78}px ui-monospace,Menlo,monospace`;
      c.fillText(no, tx, qy + u * 2.4);
      c.font = `${u * 0.66}px 'Segoe UI',sans-serif`;
      c.globalAlpha = 0.85;
      c.fillText(kl, tx, qy + u * 3.4);
      c.fillText("Berlaku tahun ajaran 2026/2027", tx, qy + u * 4.2);
      c.fillText("Tunjukkan QR ke pembina untuk absensi", tx, qy + u * 5);
    } else {
      c.fillText("", 0, 0);
      c.font = `800 ${u * 0.9}px 'Segoe UI',sans-serif`;
      c.fillText("🌸 EkskulHub", x + u * 1.3, y + u * 2);
      c.font = `700 ${u * 0.62}px 'Segoe UI',sans-serif`;
      c.textAlign = "right";
      c.fillText("KARTU ANGGOTA", x + w - u * 1.3, y + u * 2);
      c.textAlign = "left";
      c.fillStyle = "rgba(255,255,255,.3)";
      rr(c, x + u * 1.3, y + u * 3.9, u * 5.6, u * 6.6, u);
      c.fill();
      c.fillStyle = "#fff";
      c.font = `${u * 3.4}px sans-serif`;
      c.textAlign = "center";
      c.fillText("👻", x + u * 4.1, y + u * 8.2);
      c.textAlign = "left";
      const tx = x + u * 7.9,
        mw = w - u * 9.2;
      fit(c, nm, mw, u * 1.5, 800);
      c.fillText(nm, tx, y + u * 5.6);
      c.font = `${u * 0.76}px 'Segoe UI',sans-serif`;
      c.globalAlpha = 0.92;
      c.fillText(f.e.value || "email@sekolah.sch.id", tx, y + u * 6.8);
      c.globalAlpha = 1;
      const et = $("#cEi").textContent + " " + $("#cEt").textContent;
      fit(c, et, mw - u * 0.6, u * 0.85, 700);
      const ew = Math.min(c.measureText(et).width + u * 1.2, mw);
      c.fillStyle = "rgba(255,255,255,.28)";
      rr(c, tx, y + u * 7.5, ew, u * 1.6, u * 0.8);
      c.fill();
      c.fillStyle = "#fff";
      c.fillText(et, tx + u * 0.6, y + u * 8.6);
      if (kl) {
        c.font = `700 ${u * 0.78}px 'Segoe UI',sans-serif`;
        c.fillText(kl, tx, y + u * 10.2);
      }
      let bx = x + u * 1.3;
      $("#bars")
        .querySelectorAll("i")
        .forEach((i) => {
          const bw = (parseFloat(i.style.width) * u) / 10 + u * 0.06;
          c.fillRect(bx, y + h - u * 2.5, bw, u * 1.5);
          bx += bw + u * 0.1;
        });
      c.textAlign = "right";
      c.font = `700 ${u * 0.8}px ui-monospace,Menlo,monospace`;
      c.fillText(no, x + w - u * 1.3, y + h - u * 1.1);
      c.textAlign = "left";
    }
    c.restore();
  }
  save.addEventListener("click", () => {
    const W = 1080,
      w = 960,
      h = 605,
      c0 = document.createElement("canvas");
    c0.width = W;
    c0.height = 60 * 2 + h * 2 + 48;
    const c = c0.getContext("2d");
    const bg = c.createLinearGradient(0, 0, W, c0.height);
    bg.addColorStop(0, "#ffe4ee");
    bg.addColorStop(1, "#ffc0d6");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, c0.height);
    face(c, 60, 60, w, h, false);
    face(c, 60, 60 + h + 48, w, h, true);
    c0.toBlob((b) => {
      const name =
          "kartu-ekskulhub-" +
          (f.n.value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "anggota") +
          ".png",
        file = new File([b], name, { type: "image/png" });
      if (
        matchMedia("(pointer:coarse)").matches &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        navigator.share({ files: [file], title: "Kartu Anggota EkskulHub" }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
      say("Kartunya sudah disimpan. Cek galeri atau folder unduhan!");
    }, "image/png");
  });

  /* chat: modal on phones (lock scroll, inert form behind); side panel on landscape stays non-modal */
  const cbp = $("#cbPanel");
  cbp.setAttribute("aria-modal", "true");
  new MutationObserver(() => {
    const on = cbp.classList.contains("on"),
      m = on && matchMedia("(max-width:520px)").matches;
    document.body.classList.toggle("chat-open", m);
    [".wrap", ".top"].forEach((s) => {
      const e = document.querySelector(s);
      e && (e.inert = m);
    });
  }).observe(cbp, { attributes: true, attributeFilter: ["class"] });
  progress();
})();
