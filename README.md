# Typing Kids Indonesia

**Belajar Mengetik Sambil Bermain**

Game edukasi mengetik untuk anak usia **5–6 tahun** (TK / pemula membaca & keyboard).  
Bahasa: **Indonesia**. Platform: **HTML + CSS + Vanilla JS**. Siap deploy ke **Vercel**.

---

## Fitur

- Loop: gambar → suara kata → ketik keyboard → pujian → kata berikutnya
- **Misi 10 bintang** — anak kejar target sampai juara 🏆
- Milestone di 3 / 5 / 8 bintang + layar kemenangan
- **Koleksi bintang seumur hidup** + rank (Pemula → Legenda) di `localStorage`
- **3 mode:** Easy (kata full + huruf satuan) · Medium (kata full, tanpa huruf satuan) · Hard (gambar + TTS + timer)
- 🇮🇩 / 🇬🇧 language toggle + 100 kata English
- Tutorial, pilih tema, misi 10 bintang, rank, ringkasan orang tua
- Hard: timer + bonus +10 dtk sekali · progressive length dalam misi
- PWA offline shell · font Nunito self-hosted · `npm test`
- **No-fail** · ikon OpenMoji + warna solid · keyboard QWERTY

---

## Cara menjalankan

### Opsi A — npm (disarankan)

```bash
cd typing-kids-indonesia
npm install   # opsional; tidak ada dependency runtime
npm run dev
```

Buka **http://localhost:3000**

> `npm run dev` memakai `serve` (diunduh otomatis via `npx`). Tidak perlu file build.

### Opsi B — tanpa npm

Karena game memuat `data/words.json` lewat `fetch`, buka lewat server lokal (bukan `file://`):

```bash
# Python 3
python3 -m http.server 3000

# atau Node
npx serve .
```

Lalu buka `http://localhost:3000`.

---

## Deploy ke Vercel

1. Push repo ke GitHub / GitLab / Bitbucket  
2. Import project di [vercel.com](https://vercel.com)  
3. **Framework Preset:** Other  
4. **Build Command:** biarkan kosong  
5. **Output Directory:** `.` (root)  
6. Deploy  

Atau CLI:

```bash
npx vercel
```

`vercel.json` sudah disediakan (cache assets + security headers). Tidak perlu konfigurasi ekstra.

---

## Struktur folder

```
typing-kids-indonesia/
├── index.html
├── package.json
├── vercel.json
├── README.md
├── assets/
│   ├── images/          # SVG ilustrasi per kata
│   └── audio/           # (opsional) file audio kustom nanti
├── css/
│   ├── styles.css
│   └── animations.css
├── data/
│   └── words.json       # semua kata + pujian
└── js/
    ├── main.js          # entry
    ├── config.js        # pengaturan + feature flags
    ├── game.js          # game loop
    ├── words.js         # load & shuffle kata
    ├── input.js         # keyboard fisik
    ├── audio.js         # SpeechSynthesis + SFX
    ├── animation.js     # confetti / sparkle
    └── ui.js            # DOM
```

---

## Menambah kata baru

1. Edit `data/words.json`, tambahkan objek di array `words`:

```json
{
  "id": "durian",
  "word": "durian",
  "display": "Durian",
  "category": "buah",
  "image": "assets/images/durian.svg",
  "audio": null,
  "letters": 6
}
```

2. Tambah gambar di `assets/images/durian.svg` (lihat di bawah).  
3. Tidak perlu ubah kode JS — kata ikut ter-shuffle otomatis.

### Field penting

| Field | Keterangan |
|--------|------------|
| `word` | Teks yang diketik (huruf kecil, a–z) |
| `display` | Yang diucapkan voice (“Durian”) |
| `category` | `buah` \| `hewan` \| `sehari-hari` (siap filter nanti) |
| `image` | Path relatif ke SVG/PNG |
| `audio` | `null` = pakai SpeechSynthesis; path string = siap voice pack kustom |
| `letters` | Panjang kata (untuk filter difficulty nanti) |

---

## Mengganti gambar

1. Simpan ikon **PNG/SVG** di `assets/images/<id>.png` (ikon jelas, 1 objek, background polos).  
2. Update `image` di `data/words.json`, contoh: `"image": "assets/images/apel.png?v=2"`  
3. **Warna** harus solid (bukan langit/bunga).  
4. Atribusi: `assets/images/_meta/ATTRIBUTION.md`

Aset bawaan: **OpenMoji** (CC BY-SA) + solid color + SVG custom Indonesia.

---

## Mengganti / menambah suara

### Voice (kata & pujian)

1. **Voice pack MP3** (`assets/audio/voice/`) — preferensi utama (ID: Damayanti, EN: Samantha)  
2. Fallback **Web Speech API** (`speechSynthesis`) jika pack gagal dimuat  

Feature flag: `features.voicePacks` di `config.js`.

### SFX (klik, pop, celebration, combo)

Dihasilkan di `js/audio.js` lewat **Web Audio API** (tanpa file).

---

## Kontrol

| Input | Aksi |
|--------|------|
| **Mulai Main!** / Enter / Spasi | Mulai game |
| Huruf A–Z di keyboard | Isi huruf yang diminta |
| Tombol speaker | Ulangi suara kata |

Tidak ada mouse wajib di mode bermain (kecuali tombol speaker opsional).

---

## Fitur v1.7

- 4 mode: Mudah / Sedang / Sulit / **Huruf A–Z** + ID/EN  
- On-screen QWERTY + finger guide + highlight target key  
- Letter TTS (Easy + A–Z) · speaker pulse saat bicara  
- Voice pack offline 100 kata × 2 bahasa + preload  
- Misi harian + **misi minggu** + streak  
- Combo, achievements/lencana, mastery kata  
- Parent dashboard (akurasi, waktu, badges, a11y)  
- Sertifikat PNG share/download  
- Classroom: kode, papan skor lokal, export CSV  
- Tema **Huruf susah**, high-contrast / large text  
- PWA (cache voice) + unit + Playwright E2E

---

## Checklist kualitas

- [x] Modular JS, tanpa framework berat  
- [x] Tanpa error console pada alur normal  
- [x] 30 gambar SVG valid  
- [x] SpeechSynthesis + fallback  
- [x] Keyboard fisik QWERTY  
- [x] Responsive laptop / tablet  
- [x] Siap Vercel tanpa build step  

---

## Lisensi

MIT — bebas dipakai untuk edukasi & komersial.  

Dibuat dengan penuh kasih untuk anak-anak Indonesia 🇮🇩
