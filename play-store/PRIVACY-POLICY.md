# Kebijakan Privasi / Privacy Policy

**Poppu Typing Kids** (`com.poppuworld.typing`)
Berlaku efektif / Effective date: **2026-08-04**
URL resmi / Canonical URL: https://typing.poppu.world/privacy

---

## 🇮🇩 Bahasa Indonesia

### Ringkasan singkat

Poppu Typing Kids adalah aplikasi edukasi mengetik untuk anak usia 5–6 tahun. Aplikasi ini:

- **Tidak mengumpulkan, menyimpan di server, atau mengirimkan data pribadi apa pun.**
- **Tanpa iklan, tanpa pembelian dalam aplikasi, tanpa pelacak (tracker), tanpa SDK pihak ketiga.**
- Semua kemajuan belajar disimpan **hanya di perangkat** (penyimpanan lokal browser/aplikasi).
- Dapat dimainkan **sepenuhnya offline** setelah pertama kali dimuat.

### 1. Data yang disimpan di perangkat (hanya lokal)

Aplikasi menyimpan data berikut di penyimpanan lokal perangkat (`localStorage`) agar kemajuan belajar tidak hilang. Data ini **tidak pernah meninggalkan perangkat**:

- Kemajuan belajar: jumlah bintang, misi yang selesai, tingkat kesulitan, tema kata, bahasa pilihan (Indonesia/Inggris), status tutorial, misi harian/mingguan, dan rentetan hari bermain (streak).
- Statistik belajar: jumlah tombol ditekan, jumlah kesalahan ketik, dan total waktu bermain — ditampilkan sebagai ringkasan untuk orang tua.
- Lencana/prestasi dan penguasaan kata (kata yang sudah dilatih).
- Pengaturan aksesibilitas (kontras tinggi, teks besar) dan pengaturan suara (bisukan).
- Mode kelas: kode kelas 4 huruf dan papan peringkat (nama panggilan + jumlah bintang). **Papan peringkat ini hanya tersimpan di perangkat masing-masing** — tidak ada sinkronisasi antarperangkat dan tidak ada server kelas.
- Nama panggilan anak/pemain **jika** orang tua/guru mengetiknya sendiri di pengaturan (opsional, maksimal nama panggilan, tersimpan lokal).

### 2. Analitik opsional (opt-in, hanya lokal)

Aplikasi memiliki modul analitik sederhana untuk membantu orang tua melihat ringkasan belajar anak (jumlah misi dimulai, bintang pertama, kemenangan). Karakteristiknya:

- **Nonaktif secara bawaan.** Hanya berjalan jika orang tua mengaktifkannya sendiri (opt-in).
- Hanya mencatat **nama kejadian** (mis. `mission_start`, `star_earned`, `mission_win`) beserta waktunya — tanpa identitas, tanpa lokasi, tanpa data perangkat.
- Maksimal 200 kejadian terakhir, tersimpan di `localStorage` perangkat.
- **Tidak ada pengiriman data ke server mana pun.** Tidak ada layanan analitik pihak ketiga (tidak ada Google Analytics, Firebase, dsb.).

### 3. Data yang TIDAK kami kumpulkan

- Nama lengkap, alamat, email, nomor telepon, atau data identitas lain.
- Lokasi (kasar maupun presisi).
- Foto, kamera, mikrofon, kontak, atau file perangkat.
- ID iklan, sidik perangkat (device fingerprint), atau cookie pelacak.
- Riwayat penelusuran atau data lintas aplikasi.

Aplikasi tidak memiliki akun, login, atau registrasi dalam bentuk apa pun.

### 4. Koneksi jaringan

- Setelah dimuat pertama kali, aplikasi bekerja **sepenuhnya offline** (Progressive Web App dengan service worker).
- Satu-satunya permintaan jaringan adalah memuat **file aplikasi itu sendiri** (kata-kata, gambar, suara) dari domain kami sendiri (`typing.poppu.world`) — sama seperti membuka halaman web biasa. Hosting kami (Vercel) dapat mencatat log server standar (alamat IP, waktu akses) sebagai bagian dari operasi hosting; log ini tidak kami gunakan untuk mengidentifikasi atau melacak pengguna. Lihat kebijakan privasi Vercel: https://vercel.com/legal/privacy-policy
- Aplikasi **tidak melakukan panggilan jaringan ke pihak ketiga** untuk iklan, analitik, atau pelacakan.

### 5. Fitur berbagi (share)

Beberapa layar orang tua menyediakan tombol "Bagikan" (mis. ringkasan kemajuan atau sertifikat kelulusan). Fitur ini:

- Hanya aktif **saat tombol ditekan** oleh pengguna, melalui lembar berbagi bawaan sistem operasi (`navigator.share`).
- Isi yang dibagikan hanyalah teks ringkasan/gambar sertifikat yang terlihat di layar — pengguna memilih sendiri tujuan berbagi.
- Tanpa fitur ini ditekan, tidak ada data yang keluar dari perangkat.

### 6. Privasi anak (COPPA & GDPR-K)

- Aplikasi ini dirancang untuk anak usia 5–6 tahun dan mematuhi prinsip **Children's Online Privacy Protection Act (COPPA)** serta perlindungan data anak **GDPR (GDPR-K)**: kami tidak mengumpulkan informasi pribadi dari anak dalam bentuk apa pun.
- Tidak ada iklan, termasuk iklan berbasis perilaku.
- Tidak ada tautan pembelian, langganan, atau monetisasi apa pun.
- Karena tidak ada data yang dikumpulkan atau dikirim, tidak ada data anak yang disimpan di server kami — sehingga tidak ada risiko kebocoran data anak dari sisi kami.

### 7. Penghapusan data

Semua data tersimpan di perangkat Anda. Untuk menghapusnya sepenuhnya:

- Hapus data situs/aplikasi melalui pengaturan browser/perangkat (Clear site data), atau
- Copot pemasangan (uninstall) aplikasi.

Setelah itu tidak ada salinan data yang tersisa di mana pun.

### 8. Perubahan kebijakan

Jika kebijakan ini berubah, tanggal "Berlaku efektif" di atas akan diperbarui dan versi terbaru selalu tersedia di https://typing.poppu.world/privacy.

### 9. Kontak

Pertanyaan tentang privasi: **hdrvstudio@gmail.com**

---

## 🇬🇧 English

### Summary

Poppu Typing Kids is a typing-learning app for children aged 5–6. The app:

- **Does not collect, store on servers, or transmit any personal data.**
- **No ads, no in-app purchases, no trackers, no third-party SDKs.**
- All learning progress is stored **on the device only** (browser/app local storage).
- Fully playable **offline** after the first load.

### 1. Data stored on the device (local only)

The app stores the following in the device's local storage (`localStorage`) so learning progress persists. This data **never leaves the device**:

- Learning progress: star count, completed missions, difficulty level, word theme, chosen language (Indonesian/English), tutorial state, daily/weekly missions, and play streak.
- Learning statistics: keys pressed, typing mistakes, and total play time — shown as a summary for parents.
- Achievements/badges and word mastery (which words have been practiced).
- Accessibility settings (high contrast, large text) and mute preference.
- Classroom mode: a 4-letter class code and a leaderboard (nickname + star count). **This leaderboard lives only on each device** — there is no cross-device sync and no classroom server.
- A child/player nickname **only if** a parent/teacher types it in settings (optional, stored locally).

### 2. Optional analytics (opt-in, local only)

The app includes a simple analytics module to help parents see a learning summary (missions started, first star, victories):

- **Off by default.** It runs only if a parent explicitly opts in.
- It records only **event names** (e.g. `mission_start`, `star_earned`, `mission_win`) with timestamps — no identity, no location, no device data.
- Capped at the last 200 events, stored in the device's `localStorage`.
- **Nothing is sent to any server.** No third-party analytics services (no Google Analytics, Firebase, etc.).

### 3. Data we do NOT collect

- Full name, address, email, phone number, or any other identity data.
- Location (coarse or precise).
- Photos, camera, microphone, contacts, or device files.
- Advertising IDs, device fingerprints, or tracking cookies.
- Browsing history or cross-app data.

The app has no accounts, login, or registration of any kind.

### 4. Network access

- After the first load, the app works **fully offline** (Progressive Web App with a service worker).
- The only network requests are loading **the app's own files** (words, images, sounds) from our own domain (`typing.poppu.world`) — the same as opening a normal web page. Our host (Vercel) may keep standard server logs (IP address, access time) as part of hosting operations; we do not use these logs to identify or track users. See Vercel's privacy policy: https://vercel.com/legal/privacy-policy
- The app makes **no third-party network calls** for ads, analytics, or tracking.

### 5. Share feature

Some parent-facing screens offer a "Share" button (e.g. a progress summary or a graduation certificate):

- It activates **only when the button is tapped**, via the operating system's native share sheet (`navigator.share`).
- Only the on-screen summary text or certificate image is shared — the user chooses the destination.
- Unless this feature is used, no data leaves the device.

### 6. Children's privacy (COPPA & GDPR-K)

- The app is designed for children aged 5–6 and follows the principles of the **Children's Online Privacy Protection Act (COPPA)** and the GDPR's children provisions (GDPR-K): we do not collect personal information from children in any form.
- No advertising, including behavioral advertising.
- No purchase links, subscriptions, or monetization of any kind.
- Because no data is collected or transmitted, no children's data exists on our servers — so there is no server-side risk of a children's data breach.

### 7. Data deletion

All data resides on your device. To delete it completely:

- Clear the site/app data in your browser/device settings, or
- Uninstall the app.

Afterwards, no copy of the data remains anywhere.

### 8. Changes to this policy

If this policy changes, the effective date above will be updated, and the latest version is always available at https://typing.poppu.world/privacy.

### 9. Contact

Privacy questions: **hdrvstudio@gmail.com**
