const $ = (s) => document.querySelector(s);
const ghost = $("#ghost"),
  wrap = $("#gwrap"),
  eyes = $("#eyes"),
  mouth = $("#mouth"),
  sayEl = $("#say"),
  idc = $("#idc"),
  panel = $("#form"),
  cap = $("#cap");
const f = {
  n: $("#nama"),
  e: $("#email"),
  p: $("#pw"),
  c: $("#pw2"),
  k: $("#ekskul"),
  l: $("#kelas"),
  w: $("#wa"),
};
const pr = $("#pr"),
  pl = $("#pl"),
  armR = $("#armR"),
  armL = $("#armL");
const root = document.documentElement,
  tb = $("#theme"),
  syncT = () => (tb.textContent = root.dataset.theme === "dark" ? "☀️" : "🌙");
syncT();
tb.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  syncT();
});

const M = {
  idle: "M 75,115 C 79,120 91,126 101,125 110,125 126,118 127,114 125,117 117,125 101,125 85,126 79,117 75,115 Z",
  type: "M 75,115 C 79,110 92,119 101,119 110,119 123,111 127,114 131,117 118,131 102,132 87,132 73,121 75,115 Z",
  happy:
    "M 75,115 C 79,110 92,117 102,117 111,117 123,111 127,114 131,117 123,136 102,136 81,137 73,121 75,115 Z",
  sad: "M 80,127 C 86,114 118,114 124,127 C 112,121 92,121 80,127 Z",
  oh: "M 90,118 C 90,108 112,108 112,118 C 112,132 90,132 90,118 Z",
};
const A = {
  Ro: "M 45,89 C 25,92 9,108 11,124 13,141 27,115 48,119",
  Lo: "M 155,88 C 191,90 194,114 192,125 191,137 172,109 155,116",
  Rc: "M 45,89 C 54,64 103,48 106,64 108,80 65,121 48,119",
  Lc: "M 155,88 C 145,68 105,51 103,62 102,74 123,117 155,116",
  Rp: "M 45,89 C 40,70 70,52 76,64 80,76 65,121 48,119",
  Rw: "M 45,89 C 25,80 12,58 18,44 22,34 30,60 48,70",
  Lw: "M 155,88 C 180,76 190,56 184,44 180,34 172,60 155,70",
};
let mood = "idle",
  busy = false,
  tt,
  dragging = false;
const mo = (m) => {
  mood = m;
  mouth.setAttribute("d", M[m]);
  ghost.classList.toggle("happy", m === "happy");
};
const arms = (r, l) => {
  armR.setAttribute("d", A[r]);
  armL.setAttribute("d", A[l]);
};
function say(t) {
  clearInterval(tt);
  sayEl.textContent = "";
  let i = 0;
  tt = setInterval(() => {
    sayEl.textContent = t.slice(0, ++i);
    if (i >= t.length) clearInterval(tt);
  }, 16);
}
function look(x, y) {
  x = Math.max(-1, Math.min(1, x));
  y = Math.max(-1, Math.min(1, y));
  pr.style.transform = pl.style.transform = `translate(${x * 7}px,${y * 5}px)`;
}
const gc = () => {
  const r = ghost.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height * 0.37];
};
const jump = () => {
  ghost.classList.remove("jump");
  void ghost.getBoundingClientRect();
  ghost.classList.add("jump");
};
(function bl() {
  setTimeout(
    () => {
      eyes.classList.add("blink");
      setTimeout(() => eyes.classList.remove("blink"), 140);
      bl();
    },
    1800 + Math.random() * 3000,
  );
})();

/* pointer: blob, mata, kartu 3D + kilau holografik */
addEventListener("pointermove", (e) => {
  const nx = e.clientX / innerWidth - 0.5,
    ny = e.clientY / innerHeight - 0.5;
  $("#ba").style.translate = `${nx * 40}px ${ny * 40}px`;
  $("#bb").style.translate = `${nx * -50}px ${ny * -50}px`;
  const r = idc.getBoundingClientRect(),
    px = (e.clientX - r.left) / r.width,
    py = (e.clientY - r.top) / r.height;
  if (px > -0.3 && px < 1.3 && py > -0.4 && py < 1.4) {
    idc.classList.remove("rest");
    const tx = Math.max(-1, Math.min(1, px * 2 - 1)),
      ty = Math.max(-1, Math.min(1, py * 2 - 1));
    idc.style.transform = `rotateY(${tx * 16}deg) rotateX(${-ty * 14}deg)`;
    idc.style.setProperty("--hx", px * 100 + "%");
    idc.style.setProperty("--hy", py * 100 + "%");
  } else if (!idc.classList.contains("rest")) {
    idc.classList.add("rest");
    idc.style.transform = "";
  }
  if (busy || dragging || document.activeElement === f.n || document.activeElement === f.e) return;
  const [cx, cy] = gc();
  look((e.clientX - cx) / 220, (e.clientY - cy) / 220);
});

/* seret & klik Casper */
let sx = 0,
  sy = 0,
  moved = 0;
const lines = [
  "Booo! Eh, selamat datang.",
  "Aduh, geli!",
  "Topiku jangan diambil, ini topi wisuda!",
  "Isi formulirnya dulu ya, jangan main aku terus~",
];
let li = 0;
wrap.addEventListener("pointerdown", (e) => {
  dragging = true;
  moved = 0;
  sx = e.clientX;
  sy = e.clientY;
  wrap.setPointerCapture(e.pointerId);
  wrap.classList.add("drag");
  wrap.style.transition = "none";
});
wrap.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - sx,
    dy = e.clientY - sy;
  moved = Math.max(moved, Math.hypot(dx, dy));
  wrap.style.transform = `translate(${dx}px,${dy}px) rotate(${Math.max(-25, Math.min(25, e.movementX * 2))}deg)`;
  if (moved > 8 && mood !== "oh") {
    mo("oh");
    say("Eh eh, mau dibawa ke mana?!");
  }
});
function drop() {
  if (!dragging) return;
  dragging = false;
  wrap.classList.remove("drag");
  wrap.style.transition = "transform .9s cubic-bezier(.3,1.9,.5,1)";
  wrap.style.transform = "none";
  if (moved > 8) {
    mo("happy");
    say("Wuuuss! Lagi dong!");
    setTimeout(() => mo("idle"), 1500);
  } else {
    mo("oh");
    say(lines[li++ % lines.length]);
    jump();
    setTimeout(() => mo("idle"), 700);
  }
}
wrap.addEventListener("pointerup", drop);
wrap.addEventListener("pointercancel", drop);
wrap.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    jump();
    say(lines[li++ % lines.length]);
  }
});

/* data ekskul: emoji, warna, komentar */
const EK = {
  Jurnalistik: ["📷", "t", "Wartawan hantu? Siap, aku punya banyak berita seram."],
  "FASTER (Robotics & Tech)": [
    "🤖",
    "t",
    "Robot dan hantu... kombinasi menakutkan sekaligus keren.",
  ],
  "Palang Merah Remaja (PMR)": ["🩹", "b", "Penolong pertama! Aku bantu kalau ada yang pingsan."],
  Paskibra: ["🚩", "b", "Hormat grak! Aku sudah latihan berdiri tegak berabad-abad."],
  "Pencak Silat": ["🥋", "b", "Pencak Silat! Aku cuma bisa jurus tembus tembok."],
  "Bantara (Pramuka Penegak)": ["🏕", "b", "Pramuka itu seru. Aku pernah kemah seratus tahun."],
  "Tari (Kreasi & Modern)": ["💃", "s", "Menari melayang itu keahlianku."],
  "Marching Band (Drumband)": ["🥁", "s", "Drum! Aku ikut jadi hantu pembawa bendera."],
  "Robbana (Hadroh & Rebana)": [
    "🎶",
    "s",
    "Rebana, suaranya enak. Aku suka dengar dari dalam lemari.",
  ],
  "Padus (Paduan Suara)": ["🎤", "s", "Padus? Suaraku cuma bisa 'uuuu'."],
  "Bahasa Jepang (Nihon Club)": ["🎌", "k", "Konnichiwa! Aku hantu, alias yūrei."],
  "Rohis (Kerohanian Islam)": ["🕌", "k", "Pilihan yang menenangkan. Semoga aku ikut tenang."],
  Futsal: ["⚽", "o", "Futsal! Aku jadi kiper, bolanya tembus saja."],
  "Volly (Bola Voli)": ["🏐", "o", "Voli! Smash-ku bisa melayang-layang."],
};
const COL = {
  t: ["#2f5ef0", "#22c1a0"],
  b: ["#ef4f7a", "#f5b942"],
  s: ["#7c5cf0", "#ef4f7a"],
  k: ["#0e9f86", "#2f5ef0"],
  o: ["#f08a1c", "#ef4f7a"],
};

/* kartu hidup + validasi */
const emailOk = (v) => {
  const i = v.indexOf("@"),
    d = v.indexOf(".", i);
  return i > 0 && d > i + 1 && d < v.length - 1;
};
const hash = (s) => {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};
function barcode() {
  let h = hash(f.n.value + f.e.value + f.k.value) || 1,
    o = "";
  for (let i = 0; i < 30; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    o += `<i style="width:${1 + ((h >>> 28) % 3)}px"></i>`;
  }
  $("#bars").innerHTML = o;
  $("#cNo").textContent = "EH-26-" + String(hash(f.n.value + f.e.value) % 10000).padStart(4, "0");
}
barcode();
const TOTAL = 7,
  waNorm = (v) => {
    let d = v.replace(/\D/g, "");
    if (d[0] === "0") d = "62" + d.slice(1);
    else if (d[0] === "8") d = "62" + d;
    return d;
  },
  waOk = (v) => /^628\d{8,12}$/.test(waNorm(v));
const st = {
  n: () => f.n.value.trim().length >= 3,
  e: () => emailOk(f.e.value),
  p: () => f.p.value.length >= 6,
  c: () => f.c.value !== "" && f.c.value === f.p.value,
  k: () => !!f.k.value,
  l: () => !!f.l.value,
  w: () => waOk(f.w.value),
};
const msg = [
  "Mulai dari namamu",
  "Bagus, lanjut!",
  "Terus, jangan berhenti!",
  "Setengah jalan!",
  "Lebih dari separuh!",
  "Tinggal sedikit lagi!",
  "Satu lagi!",
  "Siap! Klik Daftar Sekarang",
];
function progress() {
  const n = Object.keys(st).filter((k) => st[k]()).length;
  $("#prog").style.width = (n * 100) / TOTAL + "%";
  $("#progT").textContent = n + " dari " + TOTAL + " terisi";
  $("#progN").textContent = msg[n];
  $("#progA").setAttribute("aria-valuenow", n);
  const r = n === TOTAL;
  idc.classList.toggle("ready", r);
  $("#go").classList.toggle("ready", r && !busy);
  return n;
}
function mark(row, hint, ok, text, good) {
  $(row).classList.toggle("ok", ok);
  $(row).classList.remove("err");
  $(hint).textContent = text || "";
  $(hint).classList.toggle("good", !!good);
}
f.n.addEventListener("input", () => {
  const v = f.n.value.trim(),
    c = $("#cNm");
  c.textContent = v || "Nama Lengkapmu";
  c.classList.toggle("empty", !v);
  mark("#rN", "#hN", st.n());
  mo(v ? (st.n() ? "happy" : "type") : "idle");
  if (st.n()) say("Halo, " + v.split(" ")[0] + "! Namamu sudah ada di kartu.");
  else say("Aku ikut baca ya...");
  barcode();
  progress();
  look(-1 + Math.min(f.n.selectionStart, 24) / 12, 0.6);
});
f.e.addEventListener("input", () => {
  $("#cEm").textContent = f.e.value || "email@sekolah.sch.id";
  mark("#rE", "#hE", st.e());
  mo(st.e() ? "happy" : "type");
  say(st.e() ? "Emailnya valid. Mantap!" : "Hmm, lagi ngetik email, ya?");
  barcode();
  progress();
  look(-1 + Math.min(f.e.selectionStart, 30) / 15, 0.7);
});
[f.n, f.e].forEach((i) => {
  i.addEventListener("keyup", () => look(-1 + Math.min(i.selectionStart, 28) / 14, 0.65));
  i.addEventListener("blur", () => look(0, 0));
});

/* password: tutup mata, meteran kekuatan, konfirmasi */
const showing = () => f.p.type === "text";
function cover() {
  if (showing()) {
    arms("Rp", "Lc");
  } else arms("Rc", "Lc");
  look(0, 0);
}
[f.p, f.c].forEach((i) => {
  i.addEventListener("focus", () => {
    cover();
    say(
      showing()
        ? "Sandinya kelihatan, aku pura-pura nggak lihat."
        : "Aku tutup mata. Janji nggak ngintip.",
    );
  });
  i.addEventListener("blur", () => {
    if (!busy && document.activeElement !== f.p && document.activeElement !== f.c) arms("Ro", "Lo");
  });
});
f.p.addEventListener("input", () => {
  const v = f.p.value;
  let s = 0;
  if (v.length >= 6) s++;
  if (v.length >= 10) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
  document
    .querySelectorAll("#str i")
    .forEach(
      (b, i) =>
        (b.style.background = i < s ? ["#ef4f7a", "#f5b942", "#22c1a0", "#2fbf6b"][s - 1] : ""),
    );
  mark(
    "#rP",
    "#hP",
    st.p(),
    v
      ? [
          "Terlalu pendek, minimal 6 karakter",
          "Lumayan, bisa lebih kuat",
          "Kuat",
          "Mantap, susah ditebak hantu sekalipun",
        ][s - (s > 0 ? 1 : 0)] || "Terlalu pendek, minimal 6 karakter"
      : "",
    s >= 3,
  );
  if (f.c.value) f.c.dispatchEvent(new Event("input"));
  progress();
});
f.c.addEventListener("input", () => {
  const m = st.c(),
    v = f.c.value;
  mark("#rC", "#hC", m, v ? (m ? "Password cocok" : "Belum sama dengan password di atas") : "", m);
  if (v && !m) {
    mo("type");
    say("Hmm, kok beda ya? Coba lihat lagi.");
  } else if (m) {
    mo("happy");
    say("Cocok! Kamu teliti juga.");
  }
  progress();
});
$("#peek").addEventListener("click", () => {
  const s = !showing();
  f.p.type = f.c.type = s ? "text" : "password";
  $("#peek").setAttribute("aria-pressed", s);
  $("#peek").textContent = s ? "Sembunyi" : "Lihat";
  if (s) {
    arms("Rp", "Lc");
    say("Aku intip sedikit... cuma satu mata!");
    look(0.7, 0.5);
  } else {
    arms("Rc", "Lc");
    say("Sudah ditutup lagi.");
    look(0, 0);
  }
});

/* ekskul */
f.k.addEventListener("change", () => {
  const d = EK[f.k.value],
    c = COL[d[1]];
  idc.style.setProperty("--c1", c[0]);
  idc.style.setProperty("--c2", c[1]);
  $("#cEi").textContent = d[0];
  $("#cEt").textContent = f.k.value;
  const ek = $("#cEk");
  ek.classList.remove("pop");
  void ek.offsetWidth;
  ek.classList.add("pop");
  setTimeout(() => ek.classList.remove("pop"), 400);
  mark("#rK", "#hK", true);
  arms("Ro", "Lo");
  mo("happy");
  say(d[2]);
  jump();
  look(0.4, 0.3);
  barcode();
  progress();
});

/* kirim */
function bad(row, hint, t) {
  $(row).classList.add("err");
  $(hint).textContent = t;
}
function burst(emo) {
  const r = idc.getBoundingClientRect(),
    ox = r.left + r.width / 2,
    oy = r.top + r.height / 2,
    cs = ["#2f5ef0", "#22c1a0", "#f5b942", "#ef4f7a", "#7c9bff"],
    em = [emo, "🎓", "⭐", "🎉", emo, "✨", "🏆", emo, "🎓"];
  em.forEach((c, i) => {
    const s = document.createElement("span");
    s.className = "fly";
    s.textContent = c;
    const a = -Math.PI * (0.05 + (0.9 * i) / 8),
      d = 150 + Math.random() * 130;
    s.style.cssText = `left:${ox}px;top:${oy}px;font-size:${24 + Math.random() * 14}px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d + 70}px;--r:${Math.random() * 500 - 250}deg`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1600);
  });
  for (let i = 0; i < 26; i++) {
    const b = document.createElement("span");
    b.className = "bit";
    const a = Math.random() * 6.28,
      d = 80 + Math.random() * 170;
    b.style.cssText = `left:${ox}px;top:${oy}px;background:${cs[i % 5]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--r:${Math.random() * 540 - 270}deg`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1500);
  }
}
panel.addEventListener("submit", (e) => {
  e.preventDefault();
  if (busy) {
    busy = false;
    panel.reset();
    idc.parentNode.classList.remove("done");
    $("#go").textContent = "Daftar Sekarang";
    $("#go").classList.remove("done");
    ["#rN", "#rL", "#rE", "#rW", "#rP", "#rC", "#rK"].forEach((r) =>
      $(r).classList.remove("ok", "err"),
    );
    document.querySelectorAll(".hint").forEach((h) => (h.textContent = ""));
    document.querySelectorAll("#str i").forEach((b) => (b.style.background = ""));
    $("#cNm").textContent = "Nama Lengkapmu";
    $("#cNm").classList.add("empty");
    $("#cEm").textContent = "email@sekolah.sch.id";
    $("#cEi").textContent = "🎯";
    $("#cEt").textContent = "Pilih ekskul";
    idc.style.removeProperty("--c1");
    idc.style.removeProperty("--c2");
    barcode();
    progress();
    mo("idle");
    say("Silakan, siapa lagi yang mau daftar?");
    return;
  }
  let first = null;
  if (!st.n()) {
    bad("#rN", "#hN", "Nama lengkap minimal 3 huruf.");
    first = first || f.n;
  }
  if (!st.l()) {
    bad("#rL", "#hL", "Pilih kelasmu dulu.");
    first = first || f.l;
  }
  if (!st.e()) {
    bad("#rE", "#hE", "Isi email yang valid, contoh: nama@sekolah.sch.id");
    first = first || f.e;
  }
  if (!st.w()) {
    bad("#rW", "#hW", "Isi nomor WhatsApp aktif, contoh: 0812 3456 7890");
    first = first || f.w;
  }
  if (!st.p()) {
    bad("#rP", "#hP", "Password minimal 6 karakter.");
    first = first || f.p;
  }
  if (!st.c()) {
    bad(
      "#rC",
      "#hC",
      f.c.value ? "Konfirmasi belum sama dengan password." : "Ketik ulang passwordmu.",
    );
    first = first || f.c;
  }
  if (!st.k()) {
    bad("#rK", "#hK", "Pilih satu ekstrakurikuler dulu.");
    first = first || f.k;
  }
  if (first) {
    mo("sad");
    arms("Ro", "Lo");
    say("Masih ada yang belum benar, coba cek yang merah.");
    panel.classList.remove("shake");
    void panel.offsetWidth;
    panel.classList.add("shake");
    first.focus();
    return;
  }
  busy = true;
  look(0, 0);
  arms("Rw", "Lw");
  mo("happy");
  jump();
  $("#go").classList.remove("ready");
  const no = "EH-26-" + String(hash(f.n.value + f.e.value + Date.now()) % 10000).padStart(4, "0");
  $("#cNo").textContent = no;
  idc.parentNode.classList.add("done");
  idc.classList.add("slam");
  setTimeout(() => {
    burst(EK[f.k.value][0]);
    cap.classList.remove("toss");
    void cap.getBoundingClientRect();
    cap.classList.add("toss");
  }, 350);
  say(
    "Selamat, " +
      f.n.value.trim().split(" ")[0] +
      "! Kamu resmi anggota " +
      f.k.value +
      ". Nomor kartu: " +
      no,
  );
  $("#go").textContent = "Terdaftar ✓ (klik untuk daftar orang lain)";
  $("#go").classList.add("done");
});
progress();
