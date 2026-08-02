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
- **3 mode:** Mudah (huruf besar + kotak) · Sedang (tanpa huruf besar) · Sulit (gambar + TTS saja)
- Label kata: Mudah/Sedang (bantuan setelah salah) · Sulit tidak pernah
- Tombol **mute** suara (TTS + SFX)
- **No-fail**: salah tidak menghapus progress
- 100 kata (buah, hewan, sehari-hari, kendaraan, warna, makanan, tubuh)
- **Ikon jelas** (OpenMoji) + warna solid — bukan foto rancu (langit/bunga/dll.)
- TTS browser + SFX Web Audio
- Keyboard QWERTY saja

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
