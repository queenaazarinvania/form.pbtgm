/* ==========================================================================
   card-back.js — Isi sisi belakang kartu anggota
   Menampilkan: nama, kelas, ekskul, pembina, jadwal + lokasi, serta QR (card.js).
   Diperbarui setiap kali pengguna mengubah formulir.
   ========================================================================== */
(() => {
  "use strict";

  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };

  function updateBack() {
    const ekskul = getEkskul(f.k.value);

    setText("bNm", f.n.value.trim() || "Nama Lengkapmu");
    setText("bKl", f.l.value || "-");
    setText("bEk", ekskul ? `${ekskul.emoji} ${ekskul.nama}` : "Belum memilih ekskul");
    setText("bPb", ekskul ? ekskul.pembina : "-");
    setText("bJd", ekskul ? `${ekskul.jadwal} · ${ekskul.lokasi}` : "-");
  }

  panel.addEventListener("input", () => setTimeout(updateBack, 0));
  panel.addEventListener("change", () => setTimeout(updateBack, 0));
  panel.addEventListener("reset", () => setTimeout(updateBack, 0));
  updateBack();
})();
