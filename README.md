# 🚀 WhatsApp AI Chatbot (Arsitektur Terpisah)

Chatbot WhatsApp AI canggih yang dibangun dengan arsitektur terpisah (decoupled architecture) untuk performa dan stabilitas maksimal. Proyek ini menggunakan Bridge berbasis Node.js untuk konektivitas WhatsApp dan Brain berbasis Ruby untuk pemrosesan AI menggunakan Groq API.

## 🏗️ Arsitektur

- **Bridge (Node.js)**: Menangani koneksi WhatsApp melalui `whatsapp-web.js`, menampilkan QR Code, dan mengelola log real-time melalui Socket.io.
- **Brain (Ruby)**: Memproses pesan masuk dan menghasilkan respon AI menggunakan model `llama-3.1-8b-instant` via Groq. Dihosting di atas `eksa-server` berperforma tinggi.

## ✨ Fitur Utama

- **Arsitektur Terpisah**: Pemisahan yang jelas antara logika koneksi dan logika AI.
- **Penyaringan Pintar**: Secara otomatis mengabaikan update status WhatsApp dan pesan grup.
- **Toggle Bot Aktif/Nonaktif**: Kontrol penuh untuk mematikan atau menyalakan respon bot langsung dari dashboard.
- **Jeda Respon 5 Detik**: Memberikan jeda waktu sebelum membalas agar interaksi terasa lebih alami.
- **Dashboard Real-time**: Antarmuka web untuk memindai QR Code dan memantau log secara langsung.
- **Sesi Persisten**: Menggunakan `LocalAuth` untuk menjaga Anda tetap login meskipun container dijalankan ulang.
- **Performa Tinggi**: Ruby Brain berjalan di atas `eksa-server` untuk penanganan respon yang sangat cepat.

## 🚀 Cara Deploy ke Railway

Ikuti langkah-langkah berikut untuk menjalankan chatbot Anda di Railway:

### 1. Persiapan
- Akun [Railway](https://railway.app/).
- Project Anda sudah diunggah ke repositori GitHub.

### 2. Setup Railway
1. Buat **New Project** di Railway.
2. Pilih **Deploy from GitHub repo**.
3. Pilih repositori Anda.
4. Railway akan secara otomatis mendeteksi `Dockerfile` dan memulai proses build.

### 3. Konfigurasi (Environment Variables)
Di pengaturan project Railway Anda, tambahkan variabel berikut:
- `GEMINI_API_KEY`=api_groq_anda
- `PORT`=3001
- `PUPPETEER_EXECUTABLE_PATH`=/usr/bin/chromium
- `DATA_PATH`=/app/session

### 4. Scan QR Code
Setelah berhasil dideploy, buka **Deploy Logs** di Railway.
1. Cari QR Code berbentuk ASCII di dalam log.
2. Pindai menggunakan aplikasi WhatsApp di HP Anda (Perangkat Tautan).
3. Anda juga dapat mengakses dashboard web via URL yang diberikan Railway untuk melihat QR Code.

## 🛠️ Setup Lokal

1. Instal dependensi:
   ```bash
   # Bridge
   cd bridge && npm install

   # Brain
   cd brain && bundle install
   ```
2. Siapkan file `.env` di kedua direktori tersebut.
3. Jalankan script utama:
   ```bash
   ./start.sh
   ```

## 📝 Lisensi
Proyek ini dibuat untuk tujuan edukasi.