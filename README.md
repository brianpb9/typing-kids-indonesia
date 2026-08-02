# Typing Kids Indonesia

**Belajar Mengetik Sambil Bermain**

Game edukasi mengetik untuk anak usia **5–6 tahun** (TK / pemula membaca & keyboard).  
Bahasa: **Indonesia**. Platform: **HTML + CSS + Vanilla JS**. Siap deploy ke **Vercel**.

---

## Fitur

- Loop sederhana: gambar → suara kata → ketik di keyboard fisik → pujian → kata berikutnya
- **No-fail design**: huruf salah tidak menghapus progress, tidak ada “salah / gagal / game over”
- Suara kata lewat **SpeechSynthesis** browser (+ SFX lembut lewat Web Audio)
- 30 kata: buah, hewan, kata sehari-hari
- Ilustrasi SVG pastel konsisten (bukan emoji)
- Confetti, bintang, animasi pop & float
- Keyboard QWERTY saja (tanpa keyboard on-screen)
- Modular & siap dikembangkan (kategori, difficulty, PWA, dll.)

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

1. Siapkan file **SVG** (disarankan) atau PNG transparan.  
2. Gaya: pastel, rounded, mirip aset yang ada (viewBox ~200×200).  
3. Simpan di `assets/images/<id>.svg`.  
4. Pastikan `image` di `words.json` mengarah ke path yang benar.

Hak komersial: aset bawaan adalah SVG kustom (MIT bersama proyek). Boleh diganti OpenMoji, Icons8 (lisensi sesuai sumber), Storyset, dll.

---

## Mengganti / menambah suara

### Voice (kata & pujian)

Default: **Web Speech API** (`speechSynthesis`), bahasa `id-ID` bila tersedia.

- Tidak butuh API eksternal  
- Jika suara Indonesia tidak ada di OS, browser memakai voice terdekat  

### SFX (klik, pop, celebration)

Dihasilkan di `js/audio.js` lewat **Web Audio API** (tanpa file).

Untuk file audio kustom di masa depan:

1. Taruh file di `assets/audio/` (mis. `correct.mp3`)  
2. Set `audio` di entry kata, atau extend `AudioManager`  
3. Feature flag `features.voicePacks` di `config.js` sudah disiapkan

---

## Kontrol

| Input | Aksi |
|--------|------|
| **Mulai Main!** / Enter / Spasi | Mulai game |
| Huruf A–Z di keyboard | Isi huruf yang diminta |
| Tombol speaker | Ulangi suara kata |

Tidak ada mouse wajib di mode bermain (kecuali tombol speaker opsional).

---

## Arsitektur siap masa depan

Di `js/config.js` → `features` & `gameplay`:

- Difficulty (3–8 huruf) lewat `minLetters` / `maxLetters`
- Filter kategori lewat `activeCategories`
- Parent dashboard, progress, achievements, daily challenge
- English mode, multiplayer kelas, voice packs, PWA offline

**Jangan aktifkan dulu** — deliverable awal tetap fokus: game mengetik no-fail yang menyenangkan.

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
