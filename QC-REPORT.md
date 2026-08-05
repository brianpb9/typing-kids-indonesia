# QC/QA Depth Review — Poppu Typing Kids v2.0.1

Tanggal: 2026-08-04 · Reviewer: Kimi Code (board review) · Basis: review kode penuh (20 modul JS, ~10k baris), unit test **23/23 pass**, e2e Playwright **29/29 pass**, audit aset & data terverifikasi skrip.

> **Update 2026-08-04:** Seluruh 6 temuan P0 (§Temuan Kritis) sudah diperbaiki — unit 23/23 & e2e 29/29 tetap hijau. Catatan residual: kata `orange` kini dipakai dua entri EN (buah `orange` + warna `orange-color`) setelah fix amber→orange; secara fungsional aman, tapi bisa membingungkan — kandidat perapihan data di fase berikutnya.

---

# Board Review Ronde 3 — Fix Semua Temuan Terbuka

Tanggal: 2026-08-04 · Basis: unit **33/33** (+10 test storage baru), e2e **29/29** (test offline kini benar-benar assertif), `scripts/check-assets.js` OK (80 precache + 25 refs + 24 voice clips semua ada).

## Yang diperbaiki (semua temuan P1/P2 ronde 1 & 2)

**Audio (ronde 2 P1+P2):** semua 29 file `.ogg` (SFX + voice reaction) dikonversi ke `.mp3` via ffmpeg — voice Poppu kini bunyi di Safari/iOS; `playFile` punya watchdog 3 detik; race double-audio saat klik cepat diperbaiki (AbortError dari reset sendiri dianggap sukses); BGM mengikuti `masterVolume`; mute kini ikut me-pause SFX yang sedang berbunyi.

**A11y & mobile:** regresi high-contrast diperbaiki (`.btn-start`/`.speak-btn` putih-di-biru solid **7.10:1**); tombol OSK mobile **33.5px × 44px** full-bleed tanpa horizontal scroll (terverifikasi 320/360/390px); confetti/sparkle canvas menghormati `prefers-reduced-motion`; progressbar huruf kini punya `aria-valuenow`; `.preview-star` 1.39→3.20:1.

**Game logic:** milestone mini [2,4] kini tampil semua; lucky star tidak bisa melompati milestone (cek `>=` + shown-set); mastery huruf dipisah dari statistik kata (stiker/friendship/lencana); lencana `letters_done` kini jujur (26 huruf lintas sesi); `_joinClass` tidak lagi bocor ke free-play; `words.json` gagal load → tombol "Coba lagi"; sertifikat kini bisa memuat nama anak (input opsional di dasbor orang tua); label kategori "Tubuh & Sekolah"; copy "keyboard laptop" → "keyboard"; akurasi orang tua dilabeli "sepanjang waktu"; chip kategori nonaktif di mode Huruf; `renderSlots` tidak lagi rebuild DOM per ketukan.

**Data & PWA:** duplikat `orange` di EN dihapus (entri warna; kini 99 kata, manifest voice ikut dibersihkan); ~500KB precache mati dihapus; SW `typing-kids-v24`; cabang duplikat di fetch handler dibuang; chmod aset 644; ternari mati dibersihkan.

**Test:** +10 unit test `storage.js` (streak, merge, memFallback, accuracy, class board, mastery huruf); test offline e2e kini hard-assert (warm SW → offline → reload → start screen tampil).

## Skor keseluruhan pasca-ronde-3: **9.0 / 10** (6.7 → 7.8 → 9.0)

Kenapa bukan 10 — sisa item bersifat desain/fitur, bukan defect: (1) kesulitan adaptif berbasis error belum ada; (2) layar start masih padat (±15 kontrol) — perlu keputusan desain, mis. peta sebagai satu-satunya navigasi anak; (3) `game.js`/`ui.js` masih god-object (refactor Sprint 4); (4) duplikasi `hash`/`CATS` di 3 modul misi. Keempatnya butuh product decision / refactor terjadwal, bukan quick fix.

---

# Board Review Ronde 2 — Verifikasi Fix P0 + Reskin Poppu World

Tanggal: 2026-08-04 · Basis: `git diff` penuh atas 21 file, validasi skrip, unit **23/23**, e2e **29/29**.

## Verdict fix P0: 9/10 — keenam bug FIXED, tanpa regresi

| Bug | Verdict | Catatan |
|---|---|---|
| 1. Stale timeout vs goHome | FIXED | `_defer` terlacak & bersih, guard state lengkap, tidak ada alur normal terblokir |
| 2. 8 kata EN display≠word | FIXED | 0 masalah tersisa (display==word, letters==length); pool EN semua mode aman |
| 3. OSK bocor di hard mode | FIXED | `oskHint:false` di-hard saja; easy/medium/letters identik dengan sebelumnya |
| 4. Cache-key gambar offline | FIXED | 3 situs `img.src` konsisten strip query; URL preload == URL tampil |
| 5. localStorage gagal | FIXED | Caveat minor: clear site-data mid-session baru efektif setelah reload |
| 6. Watchdog audio stall | FIXED | `finish(false)` → fallback TTS jalan, tanpa double-resolve |

## Verdict reskin: 8/10

| Area | Skor | Catatan |
|---|---|---|
| Audio (SFX/BGM) | 7/10 | Fallback berlapis rapi, autoplay & mute benar; minus format ogg (lihat P1) |
| Star/icon & a11y | 9/10 | aria-live/progressbar utuh, grayscale→gold benar |
| CSS & kontras | 7/10 | Palet utama AA–AAA (5.45–12.85:1); minus regresi a11y-contrast (P1) |
| PWA / sw.js v23 | 8/10 | 89 entri precache 0 missing; minus ~500KB precache mati (P2) |
| Higiene aset | 9/10 | Tidak ada format menyaru, ukuran wajar, atribusi lengkap |

## Temuan baru ronde 2

**P1:**
1. **Regresi mode high-contrast**: `.btn-start`/`.sound-btn` kini teks coklat gelap `#3A2A1A` di atas gradient yang berubah jadi biru tua saat `a11y-contrast` aktif → **1.94:1** (dulu putih-di-biru 7.10:1). Perlu override warna teks di blok `html.a11y-contrast` (`styles.css:2580-2588` vs `1358-1359, 1667-1672`).
2. **SFX/voice `.ogg` (Opus) tidak berbunyi di Safari < 18.4** — untuk app anak yang mayoritas iOS, fitur headline reskin (voice Poppu, star chime, win stinger) hilang; fallback synth/TTS tetap jalan. Perlu alternatif `.mp3`/`.m4a` atau deteksi `canPlayType`.

**P2:** `playFile` tanpa timeout guard; race double-audio saat klik cepat (`currentTime=0` me-reject promise in-flight → fallback synth ikut bunyi); BGM volume hardcoded 0.25 tidak ikuti `masterVolume`; mute tidak pause SFX in-flight; ~500KB precache tak direferensikan (bg-beach, sparkle, heart, badges, baloo2-1/2/4); `.preview-star` 1.39:1 (dekoratif); file mode aset 755→644.

## Skor keseluruhan pasca-ronde-2: **7.8 / 10** (naik dari 6.7)

Correctness 5→9, accessibility 6→7 (naik oleh palet, tertahan regresi a11y-contrast), optimasi aset 6.5→8, plus kategori baru: kualitas reskin 8/10.

---

## Skor Keseluruhan: 6.7 / 10 — "Solid untuk anak, rapuh di pinggir"

Fondasi game-nya kuat: filosofi no-fail konsisten, umpan balik multi-indera (suara + visual + TTS), konten ID tepat usia, PWA offline lengkap, penanganan mobile keyboard terbaik di kelasnya. Nilai turun karena: 1 bug race-condition yang mudah terpicu anak, konten EN cacat, kontras warna di bawah WCAG AA, dan janji offline yang belum sepenuhnya teruji.

| Kategori | Skor | Ringkasan |
|---|---|---|
| Gameplay & desain mode | 8/10 | 4 mode terdiferensiasi + harian/mingguan/kelas/mini; minus: hard mode bocor jawaban via OSK |
| Progresi kesulitan | 6/10 | Ramp panjang kata rapi, tapi nol adaptivitas terhadap error; combo reset oleh 1 typo |
| Konten ID | 9/10 | 100 kata bersih, tanpa duplikat, tepat usia |
| Konten EN | 5/10 | **8 kata display≠word** (cacat serius), duplikat "water", amber≠oranye |
| UX flow | 6/10 | In-game sangat baik; layar start overload ±15 kontrol, copy "keyboard laptop" di app mobile-first |
| Arsitektur kode | 7/10 | Modul ES rapi satu arah; minus god-object `Game` (1468 baris) & `UI` (1724 baris), state ganda Game↔save |
| Correctness / bug | 5/10 | Race timeout-vs-goHome, offline cache-key mismatch, progress hilang di private mode |
| Security / XSS | 8/10 | Data first-party, CSP bagus; minus `?e2e` debug handle di produksi, `unsafe-inline` script |
| Performance | 7/10 | Aset lokal ~2.7MB, rAF benar; minus animasi `left` & `box-shadow` infinite, rebuild DOM per keystroke |
| Accessibility | 6/10 | ARIA & reduced-motion CSS lengkap; minus kontras 2.9:1, progressbar tanpa `aria-valuenow` |
| Mobile / responsive | 8.5/10 | OSK-tanpa-keyboard-sistem tepat sasaran, safe-area lengkap; minus tombol OSK ~29px < 44px |
| PWA / offline | 8/10 | Precache 100% lengkap (terverifikasi 37 shell + 100 gambar + 210 MP3); minus versioning manual, tes offline ompong |
| Optimasi aset | 6.5/10 | MP3 & gambar kata efisien; minus mascot/icon PNG 114–119KB tidak terkompresi, tanpa WebP |
| Test coverage | 5/10 | Data integrity & mode matrix solid; storage/words/game-flow tanpa unit test |

---

## Temuan Kritis (P0)

### 1. Stale `setTimeout` menghidupkan "game hantu" setelah `goHome()`
`js/game.js:1186-1197, 943-946, 1244-1247, 880-883` menjadwalkan `loadNextWord`/`speakCurrentWord` via `setTimeout`, tapi `goHome()` (`js/game.js:422-442`) tidak membatalkan satupun. Skenario: anak selesai mengetik kata → tekan ← saat celebration 2 detik → ~2 detik kemudian `loadNextWord()` memaksa `state='playing'` (`game.js:876`) dan memutar suara **di layar start**; input aktif memproses kata tak terlihat. **Ditemukan independen oleh 2 reviewer — prioritas perbaikan #1.**

### 2. Delapan kata Inggris `display ≠ word` — anak melihat 9 huruf, diminta mengetik 4
Terverifikasi skrip di `data/words-en.json`:

| id | display (TTS + teks besar) | word (jawaban slot) |
|---|---|---|
| pineapple | Pineapple | pina |
| watermelon | Watermelon | water |
| strawberry | Strawberry | berry |
| rambutan | Rambutan | rambu |
| starfruit | Starfruit | star |
| elephant | Elephant | jumbo |
| butterfly | Butterfly | fly |
| rickshaw | Rickshaw | cart |

Dampak: TTS membacakan display (`game.js:972`), UI menampilkan kata penuh (`ui.js:916-946`), tapi slot hanya sepanjang `word` — kontradiksi langsung di depan anak. Plus: `water` dipakai dua kali (`words-en.json:110, 830`), dan `orange-color` ber-word `amber` dengan gambar `oranye.png`.

### 3. Mode Sulit membocorkan jawaban
OSK + jari 👆 tetap menyorot huruf berikutnya di hard mode (`game.js:868`, `game.js:1008-1012`, `ui.js:1456-1482`) — anak bisa lulus "Sulit" hanya dengan mengikuti jari, tanpa membaca/mendengar.

### 4. Gambar kata bisa rusak saat offline (cache-key mismatch)
Data gambar membawa query `?v=cartoon-2`; `sw.js:105` melucuti query saat precache, tapi `ui.js:887` memasang `img.src` **dengan** query → `caches.match` (default `ignoreSearch:false`) tidak cocok. Perangkat yang hanya mendapat warm dari SW melihat gambar rusak offline.

### 5. Progress macet total di Safari private / storage gagal
`patchSave` menelan error `setItem` (`storage.js:117-121`), `loadSave()` berikutnya kembali ke default → skor macet di 1 selamanya, streak/mastery tak pernah tersimpan. Tidak ada fallback in-memory.

---

## Temuan Tinggi (P1)

- **Kontras gagal WCAG AA**: `--primary-deep: #4A9FD8` di putih ≈ 2.9:1 (dipakai luas untuk teks: `styles.css:19`); `--text-soft` ≈ 4.35:1 < 4.5:1. Mode kontras-tinggi ada tapi tersembunyi di `<details>` orang tua.
- **Progressbar huruf tanpa `aria-valuenow`**: `index.html:399` — screen reader membaca progressbar selalu kosong (`setProgress` hanya mengubah width, `ui.js:1104-1110`).
- **Confetti/sparkle canvas mengabaikan `prefers-reduced-motion`** — tidak ada cek `matchMedia` di `animation.js`.
- **Audio pack stall dianggap sukses**: watchdog `setTimeout(finish(true), 8000)` di `audio.js:305` mencegah fallback TTS → kata tidak pernah diucapkan jika MP3 stall.
- **Animasi mahal**: `@keyframes bird-fly` menganimasikan `left` (layout per frame, `animations.css:16-27`); `glow-pulse` menganimasikan `box-shadow` infinite pada `.target-letter` (`styles.css:1779`).
- **Mastery huruf mengotori statistik kata**: `letter-a..z` ikut dihitung sebagai stiker/mastery (`game.js:1117-1121`, `1394-1396`) — anak bisa membuka lencana "50 kata master" sebagian besar dari huruf.
- **Layar start overload**: ±15 kontrol sebelum mulai (peta, misi, harian, mingguan, kelas, 4 mode, 9 kategori, stiker, dasbor orang tua) + dua sistem navigasi tumpang tindih (stasiun peta auto-start, `game.js:514`; tombol mode tidak).
- **Copy laptop-sentris**: "Tekan tombol X di keyboard laptop" (`i18n.js:79`, `index.html:497-501`) di app yang justru menonaktifkan keyboard sistem demi OSK.
- **Lucky star melompati milestone**: cek `===` di `game.js:1231`; +2 bintang bisa melewati milestone permanen. Milestone mini di 4 tidak pernah tampil (remap salah, `game.js:1200-1226`).
- **Debug handle produksi**: `window.__typingKids` terekspos via `?e2e=1` di hostname apa pun (`main.js:12-21`).
- **Aset tak terkompresi**: `poppu-idle/happy.png` 114KB per 268×360px; icon-512 116–119KB; font weight 900 dipakai heading tapi hanya 800 yang di-preload.
- **Lebar tombol OSK mobile ~29px** di bawah rekomendasi 44px (`styles.css:2724-2727`) — target kecil untuk anak 5–6 tahun.

## Temuan Sedang (P2)

- Sertifikat tanpa nama anak: `childName` terdokumentasi tapi tak pernah diisi/digambar (`certificate.js:6`, `game.js:1370-1380`).
- Tes offline e2e "best-effort" tidak bisa gagal (`e2e/offline-hard.spec.js:104-122`); perf smoke budget 8 detik tak bergigi.
- Cache SW manual `typing-kids-v22` + cache-first JS → lupa bump = pengguna terjebak versi lama; versi juga di-hardcode di 2 test.
- `words.json` gagal load → aplikasi mati tanpa tombol retry (`game.js:140-146`).
- Lencana `letters_done` menyesatkan: didapat dari misi Mini 5 huruf acak, bukan A–Z (`game.js:1297-1299`).
- Akurasi di ringkasan orang tua adalah lifetime, bukan sesi (`game.js:1335-1338`).
- Kategori tetap bisa dipilih di mode Huruf padahal diabaikan (`words.js:89-93`).
- Kategori `tubuh` berisi "sekolah"/"guru"; UI hanya menampilkan "Tubuh" (`i18n.js:69`).
- `renderSlots()` rebuild seluruh DOM slot per keystroke (`ui.js:1024`).
- Dead code: duplikasi `hash`/`CATS` 3× (daily/weekly/classroom), cabang identik `sw.js:202-205`, ternari mati `certificate.js:83` & `game.js:1461`, `funnelSummary` & `pulseClass` tak terpakai, beberapa kunci i18n mati, konfig ganda `lettersTarget`/`goals.miniTarget`.
- Hard mode tanpa umpan balik visual ketikan sama sekali (`config.js:97-102`) — frustrasi, bukan tantangan sehat.
- `?class=` / `_joinClass` mengubah difficulty tampilan free-play tanpa set `_missionKind` (`game.js:607-626`).

---

## Rekomendasi Improvement (urut prioritas)

**Sprint 1 — perbaikan kritis (1–2 hari):**
1. Track & batalkan semua `setTimeout` gameplay di `goHome()`/`_tutorialFinish` (satu array `_pendingTimeouts`, clear semua).
2. Perbaiki 8 kata EN: samakan `word` dengan kata penuh yang benar (atau ganti gambar/copy); dedupe `water`; perbaiki amber→orange.
3. Matikan sorotan OSK & jari di hard mode.
4. Samakan cache key gambar: lucuti query di `img.src` (atau `ignoreSearch:true` di SW match).
5. Fallback in-memory di `loadSave/patchSave` saat storage gagal.
6. `finish(false)` pada watchdog audio 8 detik.

**Sprint 2 — a11y & perf cepat (1 hari):**
7. Gelapkan `--primary-deep` (≥ #2E7CB5) & `--text-soft` agar ≥ 4.5:1.
8. `aria-valuenow` di `setProgress`; hormati reduced-motion di canvas; tutorial jadi `role="dialog"` + focus trap.
9. `bird-fly` → `transform`; batasi `glow-pulse`; kompres 4 PNG brand besar (atau WebP); preload font 900.
10. Perlebar tombol OSK mobile ke ≥ 40px.

**Sprint 3 — kualitas & ketangguhan:**
11. Unit test: `storage.js` (streak, merge, accuracy), pool fallback `words.js`, race timeout-vs-goHome; buat tes offline e2e benar-benar assertif.
12. Otomatiskan versi cache SW (hash konten atau build step kecil); hapus `?e2e` dari produksi.
13. Pisahkan mastery huruf/bahasa dari statistik kata; isi nama anak di sertifikat.
14. Sederhanakan layar start: jadikan peta Poppu satu-satunya navigasi anak, sembunyikan kontrol orang tua di balik gate.
15. Perbaiki copy mobile ("keyboard laptop" → netral), perbaiki remap milestone mini, guard `>=` untuk lucky-star-vs-milestone.

**Sprint 4 — arsitektur (opsional, saat integrasi IP):**
16. Pecah `game.js`/`ui.js` per fitur; konsolidasikan state ke satu sumber (save atau field, jangan dua-duanya); tambah `destroy()`/teardown listener.

---

## Catatan untuk Fase Integrasi Poppu World

> **Update 2026-08-04 (selesai):** Reskin Poppu World penuh sudah terimplementasi — maskot explorer (idle/happy/react), background garden/beach/worldmap + scrim, dekorasi cloud/bird, ikon bintang SVG + heart + 3 badge, font Baloo 2, SFX file (click/correct/wrong/star/win/milestone, fallback synth), voice reaction Poppu ID+EN, BGM loop, ikon PWA regenerate, SW `typing-kids-v23`, manifest ID. Palet baru sekalian memperbaiki kontras P1 (`--primary-deep` #8A5A36 ≈ 5.3:1). Unit 23/23 & e2e 29/29 hijau; QC visual via screenshot OK. Temuan P1/P2 lain (OSK width, tes offline assertif, copy "keyboard laptop", duplikat `orange`, dll.) masih terbuka sesuai daftar sprint di atas.

- Branding "Poppu" sudah ada sebagian (`package.json` name, mascot `assets/brand/poppu-*.png`, peta "Peta Poppu") — reskin tinggal memperdalam, bukan mulai dari nol.
- Library Poppu World punya karakter poses (poppu, zaza, momo, lumi, dll.), SFX, voice, dan font yang bisa menggantikan/melengkapi aset `assets/` saat ini; kebijakan library = copy-only (salin ke repo, jangan link).
- Sprint 4 (pemecahan modul) paling murah dilakukan **bersamaan** dengan reskin karena menyentuh file yang sama.
