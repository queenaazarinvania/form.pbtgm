/* ==========================================================================
   chatbot.js — Asisten Casper
   Alur: pesan pengguna -> (1) perintah/aksi di halaman -> (2) jawaban dari
   data ekskul -> (3) AI (jika tersedia di claude.ai) -> (4) jawaban cadangan.
   Bergantung pada: app.js (f, st, panel, say, mo, jump) dan data.js.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const el = {
    fab: $("#cbFab"),
    badge: $("#cbBadge"),
    tease: $("#cbTease"),
    teaseClose: $("#cbTx"),
    panel: $("#cbPanel"),
    status: $("#cbSt"),
    reset: $("#cbR"),
    close: $("#cbX"),
    messages: $("#cbMsgs"),
    quick: $("#cbQ"),
    form: $("#cbF"),
    input: $("#cbIn"),
    send: $("#cbSend"),
  };

  const state = { history: [], busy: false, lastEkskul: null, quiz: null, ai: undefined };
  const FIELD_ORDER = ["n", "l", "e", "w", "p", "c", "k"];
  const FIELD_LABEL = {
    n: "nama lengkap",
    l: "kelas",
    e: "email",
    w: "nomor WhatsApp",
    p: "password",
    c: "konfirmasi password",
    k: "pilihan ekskul",
  };

  /* ------------------------------------------------------------------ UI */

  const clock = () =>
    new Date()
      .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      .replace(".", ":");

  const scrollDown = () => {
    el.messages.scrollTop = el.messages.scrollHeight;
  };

  function addMessage(role, text = "") {
    const row = document.createElement("div");
    row.className = `cb-r ${role}`;

    if (role === "b") {
      const avatar = document.createElement("span");
      avatar.className = "cb-av sm";
      avatar.textContent = "👻";
      row.appendChild(avatar);
    }

    const wrap = document.createElement("div");
    wrap.className = "cb-w";
    const bubble = document.createElement("div");
    bubble.className = "cb-m";
    bubble.textContent = text;
    const time = document.createElement("div");
    time.className = "cb-t";
    time.textContent = clock();
    wrap.append(bubble, time);
    row.appendChild(wrap);

    el.messages.appendChild(row);
    scrollDown();
    return bubble;
  }

  /* Tombol saran. item = teks (dikirim sebagai pesan) atau { label, run, kind }. */
  function addChips(items, host) {
    const box = host || document.createElement("div");
    if (!host) {
      box.className = "cb-acts";
      el.messages.appendChild(box);
    }

    items.forEach((item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "cb-chip" + (item.kind === "pick" ? " pick" : "");
      chip.textContent = item.label || item;
      chip.addEventListener("click", () => (item.run ? item.run() : submit(String(item))));
      box.appendChild(chip);
    });
    scrollDown();
  }

  /* Teks muncul kata demi kata supaya terasa hidup. */
  function typeOut(bubble, text) {
    return new Promise((resolve) => {
      const calm = document.documentElement.dataset.fx === "calm";
      const words = text.split(" ");
      if (calm || words.length < 4) {
        bubble.textContent = text;
        return resolve();
      }

      let shown = 0;
      const timer = setInterval(() => {
        shown += 2;
        bubble.textContent = words.slice(0, shown).join(" ");
        scrollDown();
        if (shown >= words.length) {
          clearInterval(timer);
          resolve();
        }
      }, 28);
    });
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ------------------------------------------------------------ Bahasa */

  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s@.+-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  /* Jarak edit (Levenshtein) untuk memahami salah ketik, mis. "futsall". */
  function distance(a, b) {
    const grid = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) grid[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
      }
    }
    return grid[a.length][b.length];
  }

  function findEkskulInText(text) {
    const t = normalize(text);
    const found = [];
    const add = (name) => {
      if (name && !found.includes(name)) found.push(name);
    };

    Object.keys(ALIAS)
      .sort((a, b) => b.length - a.length)
      .forEach((key) => {
        if (new RegExp(`(^|\\s)${key}(\\s|$)`).test(t)) add(ALIAS[key]);
      });

    if (!found.length) {
      const singles = Object.keys(ALIAS).filter((k) => !k.includes(" ") && k.length >= 5);
      t.split(" ")
        .filter((w) => w.length >= 5)
        .forEach((word) => {
          add(ALIAS[singles.find((k) => distance(word, k) <= 1)]);
        });
    }
    return found;
  }

  const has = (t, ...words) => words.some((w) => t.includes(w));

  /* ----------------------------------------------------- Aksi di halaman */

  function setField(input, value) {
    input.value = value;
    input.dispatchEvent(
      new Event(input.tagName === "SELECT" ? "change" : "input", { bubbles: true }),
    );
  }

  const missingFields = () => FIELD_ORDER.filter((key) => !st[key]());

  function goToField(key) {
    const target = f[key];
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => target.focus({ preventScroll: true }), 350);
    if (window.innerWidth < 900) closePanel();
  }

  function chooseEkskul(name) {
    setField(f.k, name);
    state.lastEkskul = name;
    return `Sip, ${name} sudah kupilihkan di formulir!`;
  }

  /* Mengisi kolom dari kalimat bebas: "nama saya Rina", "kelas XI", "wa 0812...". */
  function tryFillForm(raw, t) {
    const done = [];

    const email = raw.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
    if (email) {
      setField(f.e, email[0]);
      done.push("email");
    }

    const phone = raw.match(/(?:\+?62|0)8[\d\s-]{8,14}/);
    if (phone) {
      setField(f.w, phone[0].trim());
      done.push("nomor WhatsApp");
    }

    const grade = t.match(/\bkelas\s*(xii|xi|x|12|11|10)\b/);
    if (grade) {
      const map = { 12: "XII", 11: "XI", 10: "X" };
      setField(f.l, (map[grade[1]] || grade[1]).toUpperCase());
      done.push("kelas");
    }

    const name = raw.match(
      /\bnama(?:ku|\s+saya|\s+lengkap(?:ku)?)?\s*(?:adalah|itu|:)?\s+([A-Za-z' .]{3,40})/i,
    );
    if (name) {
      const pretty = name[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      setField(f.n, pretty);
      done.push("nama");
    }
    return done;
  }

  function formReport() {
    const missing = missingFields();
    if (!missing.length)
      return {
        text: "Semua kolom sudah terisi dan valid. Tinggal klik Daftar Sekarang!",
        chips: [{ label: "Daftarkan sekarang", run: () => submitRegistration() }],
      };

    const list = missing.map((k) => `• ${FIELD_LABEL[k]}`).join("\n");
    return {
      text: `Masih ${missing.length} kolom yang belum beres:\n${list}`,
      chips: missing
        .slice(0, 3)
        .map((k) => ({ label: `Isi ${FIELD_LABEL[k]}`, run: () => goToField(k) })),
    };
  }

  function submitRegistration() {
    const missing = missingFields();
    if (missing.length) {
      reply(formReport());
      return;
    }
    closePanel();
    panel.requestSubmit();
  }

  /* ------------------------------------------------------- Jawaban data */

  const describe = (e) =>
    `${e.emoji} ${e.nama} (${e.kategori})\n• Jadwal: ${e.jadwal}\n• Lokasi: ${e.lokasi}\n• Pembina: ${e.pembina}\n• Kuota: ${kuotaText(e)}\n${e.deskripsi}`;

  const pickChips = (names) =>
    names.map((n) => ({
      label: `Pilih ${n.replace(/ \(.*/, "")}`,
      kind: "pick",
      run: () => reply({ text: chooseEkskul(n) }),
    }));

  function recommend(interest, day) {
    const key = interest.toLowerCase();
    const scored = EKSKUL_DATA.map((e) => {
      let score = e.minat.includes(key) ? 3 : 0;
      if (day && e.hari.includes(day)) score += 2;
      if (e.kuota == null || e.kuota >= 5) score += 1;
      return { e, score };
    })
      .filter((x) => x.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const lines = scored.map(({ e }) => `${e.emoji} ${e.nama}: ${e.jadwal}, ${kuotaText(e)}`);
    state.lastEkskul = scored[0] ? scored[0].e.nama : state.lastEkskul;
    return {
      text: `Untuk minat ${interest}${day ? ` yang longgar hari ${day}` : ""}, aku sarankan:\n${lines.join("\n")}`,
      chips: pickChips(scored.map((x) => x.e.nama)),
    };
  }

  function handleQuiz(t) {
    if (state.quiz.step === "interest") {
      const interest = INTERESTS.find((i) => t.includes(i.toLowerCase().split(" ")[0]));
      if (!interest) return { text: "Pilih salah satu minat di bawah ya.", chips: INTERESTS };
      state.quiz = { step: "day", interest };
      return {
        text: "Oke! Hari apa kamu paling longgar untuk latihan?",
        chips: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Bebas"],
      };
    }
    const day = DAYS.find((d) => t.includes(d));
    const interest = state.quiz.interest;
    state.quiz = null;
    return recommend(interest, day);
  }

  /* ------------------------------------------------------ Router intent */

  function route(raw) {
    const t = normalize(raw);
    const found = findEkskulInText(raw);
    const subject = found[0] || state.lastEkskul;
    if (found[0]) state.lastEkskul = found[0];

    if (state.quiz) return handleQuiz(t);

    // 1) Aksi di halaman
    if (
      /\b(pilih|pilihkan|ambil|masukkan|daftarkan)\b/.test(t) &&
      found[0] &&
      !has(t, "jadwal", "kapan")
    ) {
      return {
        text: chooseEkskul(found[0]),
        chips: [{ label: "Cek formulirku", run: () => submit("cek formulir") }],
      };
    }
    const filled = tryFillForm(raw, t);
    if (filled.length) {
      const more = missingFields().length;
      return {
        text: `Sudah kuisi: ${filled.join(", ")}. ${more ? `Masih ${more} kolom lagi.` : "Formulirmu sudah lengkap!"}`,
        chips: ["Cek formulirku"],
      };
    }
    if (has(t, "cek formulir", "apa yang kurang", "sudah lengkap", "yang belum", "progres"))
      return formReport();
    if (has(t, "balik kartu", "belakang kartu", "sisi belakang", "lihat belakang")) {
      $("#inner").classList.toggle("flip");
      const back = $("#inner").classList.contains("flip");
      return {
        text: back
          ? "Ini sisi belakang kartumu: QR unik untuk absensi, nama, kelas, ekskul, pembina, serta jadwal dan lokasi latihan. Tunjukkan QR ke pembina ya."
          : "Kartu kubalik ke depan lagi.",
      };
    }
    if (has(t, "simpan kartu", "unduh kartu", "download kartu")) {
      const save = $("#save");
      if (save && !save.hidden) {
        save.click();
        return { text: "Kartunya sedang disimpan sebagai gambar PNG." };
      }
      return {
        text: "Tombol simpan muncul setelah kamu berhasil mendaftar. Lengkapi formulir dulu ya.",
        chips: ["Cek formulirku"],
      };
    }
    if (has(t, "mode gelap", "tema gelap", "mode terang", "tema terang", "ganti tema")) {
      $("#theme").click();
      return { text: "Tema sudah kuganti." };
    }
    if (has(t, "hemat", "mode ringan", "efek berat", "matikan efek")) {
      $("#fxBtn").click();
      return { text: "Mode efek sudah kuganti. Cek tombol 🌸/🍃 di pojok kanan atas." };
    }
    if (/\b(daftar sekarang|kirim formulir|submit)\b/.test(t)) {
      submitRegistration();
      return { text: "Oke, kucoba daftarkan sekarang." };
    }

    // 2) Pengetahuan ekskul
    if (found.length === 2 && has(t, "banding", "beda", "atau", "vs")) {
      const [a, b] = found.map(getEkskul);
      return {
        text: `${a.emoji} ${a.nama}: ${a.jadwal}, ${a.lokasi}, ${kuotaText(a)}.\n${b.emoji} ${b.nama}: ${b.jadwal}, ${b.lokasi}, ${kuotaText(b)}.`,
        chips: pickChips(found),
      };
    }
    if (has(t, "rekomendasi", "saran", "cocok", "bingung", "pilih apa")) {
      state.quiz = { step: "interest" };
      return { text: "Seru! Kamu paling tertarik ke bidang apa?", chips: INTERESTS };
    }
    const day = DAYS.find((d) => t.includes(d));
    if (day && !found.length) {
      const list = EKSKUL_DATA.filter((e) => e.hari.includes(day));
      return {
        text: `Ekskul hari ${day}:\n${list.map((e) => `${e.emoji} ${e.nama} (${e.jadwal.split(", ")[1]}, ${e.lokasi})`).join("\n")}`,
        chips: pickChips(list.map((e) => e.nama).slice(0, 3)),
      };
    }
    if (has(t, "kuota") && !found.length) {
      const list = EKSKUL_DATA.filter((e) => e.kuota != null)
        .sort((a, b) => a.kuota - b.kuota)
        .slice(0, 4);
      return {
        text: `Kuota paling tipis saat ini:\n${list.map((e) => `${e.emoji} ${e.nama}: sisa ${e.kuota}`).join("\n")}\nBuruan sebelum penuh!`,
        chips: pickChips(list.map((e) => e.nama).slice(0, 3)),
      };
    }
    if (subject && has(t, "jadwal", "kapan", "jam")) {
      const e = getEkskul(subject);
      return {
        text: `${e.emoji} ${e.nama}: ${e.jadwal} di ${e.lokasi}.`,
        chips: pickChips([subject]),
      };
    }
    if (subject && has(t, "pembina", "pelatih", "guru", "siapa")) {
      const e = getEkskul(subject);
      return { text: `${e.nama} dibina oleh ${e.pembina}.`, chips: pickChips([subject]) };
    }
    if (subject && has(t, "lokasi", "dimana", "di mana", "tempat")) {
      const e = getEkskul(subject);
      return { text: `${e.nama} latihan di ${e.lokasi}, ${e.jadwal}.` };
    }
    if (subject && has(t, "kuota", "sisa", "penuh")) {
      const e = getEkskul(subject);
      return { text: `${e.nama}: ${kuotaText(e)}.`, chips: pickChips([subject]) };
    }
    if (found.length)
      return { text: describe(getEkskul(found[0])), chips: pickChips(found.slice(0, 2)) };
    if (has(t, "apa saja", "daftar ekskul", "semua ekskul", "ada apa")) {
      const byCat = {};
      EKSKUL_DATA.forEach(
        (e) => (byCat[e.kategori] = (byCat[e.kategori] || []).concat(e.nama.replace(/ \(.*/, ""))),
      );
      return {
        text: Object.entries(byCat)
          .map(([c, n]) => `${c}: ${n.join(", ")}`)
          .join("\n"),
        chips: ["Rekomendasikan ekskul"],
      };
    }

    // 3) Bantuan umum
    if (has(t, "password", "sandi", "kata sandi"))
      return {
        text: "Password minimal 6 karakter. Campur huruf besar-kecil, angka, dan simbol agar kuat. Jangan ketik password di chat ini ya, isi langsung di formulir.",
      };
    if (has(t, "cara", "gimana", "bagaimana", "langkah") && has(t, "daftar", "isi"))
      return {
        text: "Langkahnya: isi nama, kelas, email, WhatsApp, password dan konfirmasinya, lalu pilih ekskul. Setelah semua hijau, klik Daftar Sekarang. Kartumu langsung jadi dan bisa disimpan sebagai gambar.",
        chips: ["Cek formulirku"],
      };
    if (has(t, "whatsapp", "wa ") || t === "wa")
      return {
        text: "Nomor WhatsApp dipakai pembina untuk menambahkanmu ke grup ekskul. Format: 08xx atau +62 8xx.",
      };
    if (/^(halo|hai|hi|hey|assalam|selamat)/.test(t))
      return {
        text: "Hai! Aku Casper. Aku bisa jawab soal jadwal, pembina, kuota, merekomendasikan ekskul, dan membantu mengisi formulir.",
      };
    if (has(t, "terima kasih", "makasih", "thanks"))
      return { text: "Sama-sama! Semoga sukses di ekskulnya 🎓" };

    return null; // belum dipahami -> serahkan ke AI
  }

  /* ---------------------------------------------------------------- AI */

  function buildSystemPrompt() {
    const catalog = EKSKUL_DATA.map(
      (e) =>
        `${e.nama} | ${e.kategori} | ${e.jadwal} | ${e.lokasi} | pembina ${e.pembina} | ${kuotaText(e)}`,
    ).join("\n");
    const missing =
      missingFields()
        .map((k) => FIELD_LABEL[k])
        .join(", ") || "tidak ada";
    return [
      "Kamu Casper, hantu ramah bertopi wisuda, asisten EkskulHub SMA 1 Prestasi Bangsa.",
      "Jawab bahasa Indonesia santai, maksimal 3 kalimat. Hanya bahas ekskul dan pendaftaran di halaman ini.",
      "Gunakan HANYA data berikut; jika tidak ada, katakan tidak tahu dan sarankan tanya pembina. Jangan meminta password.",
      `Katalog:\n${catalog}`,
      `Kolom formulir yang belum beres: ${missing}.`,
    ].join("\n");
  }

  async function askAI(text) {
    if (state.ai === undefined) {
      try {
        state.ai = typeof claude !== "undefined" ? await claude.use("sample") : null;
      } catch (error) {
        state.ai = null;
      }
    }
    if (!state.ai) return null;

    const turns = [
      { role: "user", content: `${buildSystemPrompt()}\nMulai percakapan.` },
      { role: "assistant", content: "Siap, aku Casper!" },
      ...state.history.slice(-8),
    ];
    try {
      const result = await state.ai(turns, { cache: false });
      return result && result.text ? result.text : null;
    } catch (error) {
      if (error && error.code === "not_granted") state.ai = null;
      return null;
    }
  }

  const FALLBACK = {
    text: "Hmm, aku belum paham maksudmu. Coba tanya jadwal, pembina, atau kuota sebuah ekskul, minta rekomendasi, atau suruh aku mengisi formulir.",
    chips: ["Rekomendasikan ekskul", "Ekskul hari Rabu", "Cek formulirku"],
  };

  /* -------------------------------------------------------- Kirim/balas */

  async function reply(result) {
    const bubble = addMessage("b", "");
    bubble.classList.add("dots");
    bubble.innerHTML = "<i></i><i></i><i></i>";
    el.status.textContent = "Sedang mengetik...";
    await wait(350 + Math.random() * 300);

    bubble.classList.remove("dots");
    bubble.textContent = "";
    await typeOut(bubble, result.text);
    state.history.push({ role: "assistant", content: result.text });
    if (result.chips) addChips(result.chips);

    el.status.textContent = "Online · membalas cepat";
    if (typeof mo === "function") {
      mo("happy");
      jump();
      setTimeout(() => mo("idle"), 1800);
    }
  }

  async function submit(text) {
    text = text.trim();
    if (!text || state.busy) return;
    state.busy = true;
    el.send.disabled = true;
    el.input.value = "";
    el.quick.style.display = "none";

    addMessage("u", text);
    state.history.push({ role: "user", content: text });

    let result = route(text);
    if (!result) {
      const aiText = await askAI(text);
      result = aiText
        ? { text: aiText, chips: pickChips(findEkskulInText(aiText).slice(0, 2)) }
        : FALLBACK;
    }
    await reply(result);

    state.busy = false;
    el.send.disabled = false;
    el.input.focus();
  }

  /* --------------------------------------------------------- Buka/tutup */

  function greet() {
    addMessage(
      "b",
      "Halo! Aku Casper, asisten EkskulHub. Aku bisa jawab soal jadwal, pembina, dan kuota, merekomendasikan ekskul, bahkan membantu mengisi formulirmu.",
    );
    el.quick.innerHTML = "";
    el.quick.style.display = "";
    addChips(
      [
        "Rekomendasikan ekskul",
        "Cek formulirku",
        "Ekskul hari Rabu",
        "Kuota hampir habis",
        "Balik kartu",
      ],
      el.quick,
    );
  }

  function openPanel() {
    el.panel.classList.add("on");
    el.fab.classList.add("hide");
    el.tease.classList.remove("on");
    el.badge.style.display = "none";
    if (!el.messages.children.length) greet();
    setTimeout(() => el.input.focus(), 300);
  }

  function closePanel() {
    el.panel.classList.remove("on");
    el.fab.classList.remove("hide");
  }

  el.fab.addEventListener("click", openPanel);
  el.tease.addEventListener("click", openPanel);
  el.teaseClose.addEventListener("click", (e) => {
    e.stopPropagation();
    el.tease.classList.remove("on");
  });
  el.close.addEventListener("click", closePanel);
  el.reset.addEventListener("click", () => {
    el.messages.innerHTML = "";
    Object.assign(state, { history: [], quiz: null, lastEkskul: null });
    greet();
  });
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(el.input.value);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.panel.classList.contains("on")) closePanel();
  });

  setTimeout(() => {
    if (!el.panel.classList.contains("on")) el.tease.classList.add("on");
  }, 2000);

  const note = document.querySelector(".cb-pw");
  if (note)
    note.textContent =
      typeof claude !== "undefined"
        ? "Dijawab dari data katalog ekskul + AI · cek ke pembina bila ragu"
        : "Asisten otomatis berbasis data katalog ekskul";
})();
