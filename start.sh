#!/bin/bash

# Fungsi untuk mematikan semua proses saat script dihentikan (Ctrl+C)
cleanup() {
    echo ""
    echo "Menghentikan semua server..."
    kill $BRAIN_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "------------------------------------------"
echo "🚀 Menjalankan WhatsApp AI Chatbot..."
echo "------------------------------------------"

# 1. Jalankan Ruby Brain di background
echo "1. Memulai Ruby Brain (eksa-server) di port 3000..."
(cd brain && bundle exec eksa-server -p 3000 -c 0 config.ru > /dev/null 2>&1) &
BRAIN_PID=$!

# Cek apakah brain berhasil jalan
sleep 2
if ps -p $BRAIN_PID > /dev/null; then
    echo "✅ Ruby Brain berhasil dijalankan (PID: $BRAIN_PID)"
else
    echo "❌ Gagal menjalankan Ruby Brain. Periksa konfigurasi Anda."
    exit 1
fi

# 2. Jalankan Node.js Bridge di foreground
echo "2. Memulai Node.js Bridge di port 3001..."
echo "------------------------------------------"
cd bridge && node server.js
