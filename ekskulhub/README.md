# EkskulHub — Pendaftaran Anggota Ekskul

Halaman pendaftaran dengan kartu anggota 3D interaktif, maskot Casper, efek sakura,
dan chatbot yang bisa menjawab sekaligus mengisi formulir.
Tanpa build tool dan tanpa dependensi luar — cukup unggah ke GitHub.

## Struktur

```
index.html            kerangka halaman
css/
  base.css            dasar, tata letak, formulir
  chatbot.css         tampilan widget chat
  theme.css           tema sakura + terang/gelap
  card.css            kartu anggota (depan & belakang)
  glass-layout.css    efek kaca, responsif, mode efek
  improvements.css    kontras, safe-area, mobile & landscape
  smooth.css          gerakan halus + isi sisi belakang kartu
js/
  app.js              logika formulir, validasi, Casper
  data.js             DATA EKSKUL (pembina, jadwal, lokasi, kuota) <- edit di sini
  chatbot.js          asisten Casper (aksi, data, AI opsional)
  sakura.js           kelopak sakura (canvas) & ranting
  card.js             balik kartu, QR, cincin progres, gyro
  card-back.js        isi sisi belakang kartu
  effects.js          tilt halus, jejak kursor, tombol magnetik
  improvements.js     mode hemat, draf otomatis, simpan kartu PNG
```

Urutan `<script>` di `index.html` penting: semua berkas berbagi lingkup global.

## Deploy ke GitHub Pages
1. Unggah seluruh isi folder ini ke repositori.
2. Settings → Pages → Source: branch `main`, folder `/ (root)`.

## Mengubah data ekskul
Edit `js/data.js`. Nama ekskul harus sama persis dengan `<option>` di dropdown `index.html`.
Sisi belakang kartu dan jawaban chatbot otomatis mengikuti data ini.

## Chatbot
- Perintah: "pilih futsal", "nama saya ...", "kelas XI", "wa 0812...", "cek formulir",
  "balik kartu", "simpan kartu", "mode gelap", "hemat efek", "daftar sekarang".
- Pertanyaan: jadwal/pembina/lokasi/kuota tiap ekskul, ekskul per hari, perbandingan, rekomendasi.
- Jawaban AI untuk pertanyaan bebas hanya aktif di claude.ai; di GitHub chatbot memakai data lokal.

## Catatan
- Draf formulir disimpan di localStorage perangkat. Password tidak pernah disimpan.
- Formulir belum terhubung ke server: sambungkan submit di `js/app.js` ke API/Google Form sekolah.
