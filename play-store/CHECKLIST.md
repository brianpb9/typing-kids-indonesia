# Checklist Rilis Google Play — Poppu Typing Kids

Runbook langkah demi langkah di **Play Console** (https://play.google.com/console).
Artefak yang sudah disiapkan ada di folder `play-store/` ini.

> ⚠️ **Package ID `com.poppuworld.typing` bersifat PERMANEN** — tidak bisa diubah setelah aplikasi dibuat. Pastikan ejaan benar saat langkah 1.

> 📦 **Keputusan 2026-08-04 — dua artefak Android:**
> - **RILIS PRODUKSI (dipakai):** Capacitor WebView wrapper — `/Users/brian/Grok/poppu-typing-android/android/app/build/outputs/bundle/release/app-release.aab` (7.8 MB, versionCode 2, signed, fingerprint `CB:4A:EF:14:…:72:A3` cocok dengan `assetlinks.json`). Dipakai karena **TWA tidak diterima di program Designed for Families** (aplikasi anak <13 wajib program ini). Web app di-bundle penuh di dalam app (offline by construction). Re-sync web: `cd /Users/brian/Grok/poppu-typing-android && ./sync-web.sh && npx cap sync android && cd android && ./gradlew bundleRelease` (naikkan versionCode di `android/app/build.gradle` — rilis Capacitor berikutnya mulai dari **4**, karena 3 dipakai TWA).
> - **INTERNAL TESTING (opsional):** TWA Bubblewrap — `/Users/brian/Grok/poppu-typing-twa/` (versionCode 3, host `typing.poppu.world`). Hanya untuk track internal; jangan dipakai untuk produksi kategori anak. Play Console mewajibkan versionCode unik seumur aplikasi — jangan upload dua artefak dengan versionCode sama.
> - **Domain produksi:** `https://typing.poppu.world` (live sejak 2026-08-04; URL lama `typing-kids-indonesia.vercel.app` tetap aktif sebagai fallback). Privacy policy: `https://typing.poppu.world/privacy`.
> - Keystore upload key: `~/keys/poppu-typing.keystore` (di luar repo, password di `~/keys/poppu-typing-password.txt`). **Backup keduanya di luar mesin ini** — kehilangan upload key = tidak bisa update aplikasi selamanya (kecuali reset via Play Console).

---

## 0. Prasyarat (sekali saja)

- [ ] Akun **Google Play Developer** aktif (biaya satu kali US$25, dibayar user).
- [ ] Verifikasi identitas developer selesai (KTP/paspor + metode pembayaran, sesuai permintaan Google).
- [ ] File **AAB signed** — gunakan **Capacitor AAB** di path di atas.
- [x] `/.well-known/assetlinks.json` di produksi sudah berisi SHA-256 fingerprint asli dan ter-serve 200 + JSON valid.

## 1. Buat aplikasi

Play Console → **All apps / Semua aplikasi** → **Create app / Buat aplikasi**:

- **App name / Nama aplikasi:** `Poppu Typing Kids`
- **Default language / Bahasa default:** Indonesian (id-ID)
- **App or game / Aplikasi atau game:** App / Aplikasi
- **Free or paid / Gratis atau berbayar:** **Free / Gratis**
- Centang deklarasi: **Developer Program Policies** dan **US export laws**.
- Klik **Create app**.

## 2. Dasbor penyiapan (Dashboard → "Set up your app")

Play Console akan menampilkan daftar tugas wajib. Urutan di bawah mengikuti menu kiri konsol.

### 2.1 App access / Akses aplikasi
- Pilih: **"All or some functionality is available without special access"** — aplikasi tanpa login sama sekali.

### 2.2 Ads / Iklan
- Jawab: **"No, my app does not contain ads" / "Tidak, aplikasi saya tidak berisi iklan"**.

### 2.3 Content rating / Rating konten (IARC)
Menu: **Policy → App content → Content rating** → **Start questionnaire**:
- Kategori kuesioner: pilih yang tersedia untuk aplikasi utilitas/edukasi (bukan "Game" — TWA kita kategori App; jika ditawarkan, pilih **"Utility, Productivity, Communication, or Other"** lalu jawab jujur).
- Semua pertanyaan kekerasan/seksual/kasar/judi/zat: **Tidak / No**.
- User-generated content / berbagi antarpengguna: **Tidak** (mode kelas & papan peringkat murni lokal di perangkat, tidak ada pertukaran konten antarpengguna lewat internet).
- Lokasi/berbagi info pribadi: **Tidak**.
- Hasil yang diharapkan: **Everyone / Semua Umur (3+)**. Simpan sertifikat IARC.

### 2.4 Target audience & content / Audiens target & konten
Menu: **Policy → App content → Target audience and content**:
- **Target age groups:** centang rentang yang mencakup **5–6 tahun** (mis. "Ages 5 and under" **dan** "Ages 6–8").
- Karena memilih usia anak → konsol mewajibkan **Designed for Families** → lanjut ke 2.5.
- **Store presence:** "Appeal to children" — jawab sesuai: aplikasi memang ditujukan untuk anak → **Yes** (ini yang memicu kewajiban Families; sudah sesuai desain kita).
- Pertanyaan lanjutan (praktik iklan dsb.): tidak ada iklan → **Not applicable / No**.

### 2.5 Designed for Families / Program Keluarga
Menu: **Policy → App content → Target audience and content** (bagian Families) atau banner khusus:
- Setujui persyaratan **Families Policy** dan (bila diminta) **Teacher Approved** opt-in boleh dilewati dulu (review terpisah).
- Deklarasi praktik aplikasi:
  - Iklan: **tidak ada iklan**.
  - SDK pihak ketiga bersertifikasi Families: **tidak ada SDK pihak ketiga sama sekali** → aman.
  - Pengumpulan data anak: **tidak ada**.
- ✅ **SELESAI — parental gate sudah diimplementasikan.** Semua fitur yang mengarah keluar aplikasi kini berada di balik gerbang orang tua (soal perkalian, sesi 5 menit di memori, tidak pernah disimpan):
  1. ~~Tautan `https://www.poppu.world` tampil di layar utama~~ → **DONE**: tautan brand & semua tautan eksternal dipindah ke blok parent-links di dalam dasbor orang tua (`index.html` ~228-244).
  2. ~~Tombol Bagikan di beberapa layar~~ → **DONE**: semua pemicu share (ringkasan orang tua, sertifikat, kelas) melewati `ui.requireGate(...)`.
  3. ~~Tidak ada parental gate~~ → **DONE**: gerbang perkalian (`#gate-overlay`, `index.html` ~336-356) mengintercept `<details>` dasbor orang tua; terikat sebelum data kata dimuat, sehingga aktif juga saat offline first-run.
  4. ~~Tautan kebijakan privasi di dalam aplikasi~~ → **DONE**: `#privacy-link` berada di dalam dasbor orang tua yang digerbang.

### 2.6 News apps / COVID / dsb.
- **Bukan** aplikasi berita → jawab "No" untuk kategori-kategori yang tidak relevan.

### 2.7 Data safety / Keamanan data
Menu: **Policy → App content → Data safety** → isi form:

| Pertanyaan | Jawaban | Alasan |
|---|---|---|
| Does your app collect or share any of the required user data types? | **No** | Semua data (kemajuan, nama panggilan, papan peringkat, analitik opt-in) hanya disimpan di `localStorage` perangkat dan **tidak pernah dikirim keluar perangkat** — verifikasi: `js/analytics.js` hanya memanggil `patchSave` (lokal), tidak ada `fetch`/beacon ke server; semua `fetch` di kode hanya memuat file same-origin. |
| Data shared with third parties | **No** (tidak muncul jika jawaban atas = No) | Tidak ada SDK pihak ketiga, tidak ada transmisi. |

Jika konsol tetap meminta deklarasi per tipe data: centang **"No data collected"**. Bagian "Data is encrypted in transit" dan "Users can request deletion" tidak wajib diisi bila tidak ada pengumpulan; bila diminta, deletion bisa dijawab via mekanisme perangkat (clear site data / uninstall).
- **Privacy policy URL (wajib):** `https://typing.poppu.world/privacy`

### 2.8 Government apps / Financial features / Health
- Semua: **tidak berlaku / No**.

## 3. Store listing (Grow → Store presence → Main store listing)

### 3.1 Bahasa default: Indonesian (id-ID)
Salin dari `play-store/listing-id.md`: judul, deskripsi singkat, deskripsi lengkap.
Tambahkan terjemahan **English (en-US)** dari `play-store/listing-en.md` via **Manage translations**.

### 3.2 Aset grafis wajib

| Aset | Ukuran | Sumber |
|---|---|---|
| Ikon aplikasi (hi-res) | 512×512 PNG 32-bit | ✅ `assets/brand/poppu/icon-512.png` |
| Feature graphic | 1024×500 PNG/JPG | ✅ `play-store/feature-graphic.png` |
| Screenshot ponsel | **min. 2**, maks 8, rasio 16:9 atau 9:16, sisi 320–3840 px | Gunakan `test-results/reskin-home-mobile.png` + `reskin-game-mobile.png` (+ `reskin-victory-mobile.png`); versi desktop bisa untuk slot tablet 7"/10" bila diklaim. Screenshot diregenerasi via `node scripts/friends-shots.js` (file mendarat di `test-results/`) |
| Kategori | — | **Education / Edukasi** |
| Email kontak | wajib publik | `hdrvstudio@gmail.com` |
| Situs web | opsional | `https://typing.poppu.world` |
| Kebijakan privasi | wajib | `https://typing.poppu.world/privacy` |

> Catatan: cek dimensi screenshot `reskin-*.png` dengan `sips -g pixelWidth -g pixelHeight`; bila sisi < 320px atau rasio tidak memenuhi, render ulang via Playwright.

## 4. Upload & rilis bertahap

1. **Release → Testing → Internal testing** → **Create new release**:
   - Upload **AAB** Capacitor: `/Users/brian/Grok/poppu-typing-android/android/app/build/outputs/bundle/release/app-release.aab` (signed, versionCode 2, versionName 2.0.1 — lihat kotak keputusan di atas).
   - Nama rilis: `2.0.1 (2)`; catatan rilis (id): `Rilis pertama Poppu Typing Kids!` / (en): `First release of Poppu Typing Kids!`
   - **Play App Signing**: biarkan Google mengelola app signing (rekomendasi default; upload key kita tetap lokal — fingerprint-nya yang di assetlinks.json).
2. Tambahkan **tester** (email Google milik user) → bagikan link internal test → **install di perangkat fisik** dan uji: TWA fullscreen tanpa address bar (tanda assetlinks valid), offline mode, audio, semua mode.
3. Bila bersih → **Promote release → Production** (atau buat release production baru) → **Review**.
   - Review aplikasi anak (Families) biasanya lebih lama, bisa **hingga 7 hari+**.

## 5. Setelah rilis

- [ ] Pantau **Policy status** & email developer (potensi pertanyaan reviewer soal Families).
- [ ] Update `play-store/` di repo bila ada jawaban form yang berubah.
- [ ] Rencanakan **Teacher Approved** opt-in (opsional, menambah visibilitas).
- [ ] Setiap update AAB: bump `versionCode` di konfigurasi Bubblewrap (`twa-manifest.json`), rebuild, upload ke track yang sama.

---

### Ringkasan status artefak

- [x] Privacy policy: `play-store/PRIVACY-POLICY.md` + live di `/privacy`
- [x] Listing ID/EN: `play-store/listing-id.md`, `play-store/listing-en.md`
- [x] Feature graphic: `play-store/feature-graphic.png`
- [x] assetlinks.json: `.well-known/assetlinks.json` (fingerprint SHA-256 asli, live dan cocok dengan AAB Capacitor)
- [x] Email kontak final: `hdrvstudio@gmail.com`
- [x] Parental gate + relokasi tautan eksternal (SELESAI — lihat 2.5)
- [ ] Keystore + AAB (Bagian B.3, di luar repo)
- [ ] Akun Play Developer + pembayaran (user)
