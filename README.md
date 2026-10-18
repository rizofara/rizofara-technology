# Rizofara Technology — Digital Roots for a Brighter Tomorrow 🚀

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)

Website platform bisnis profesional untuk layanan asistensi akademik (tugas kuliah, program skripsi) serta solusi software house komersial (pembuatan website custom, chatbot AI, dan UI/UX wireframing).

---

## 🌟 Fitur Utama Platform

1. **🧮 Kalkulator Estimasi Biaya Interaktif:**
   - Klien dapat menghitung perkiraan biaya secara mandiri berdasarkan jenis layanan, platform, tingkat kerumitan, dan deadline (mulai dari 5 hari).
   - Opsi tambahan: Pembuatan laporan/bab pembahasan algoritma dan **Desain Wireframe UI/UX (Balsamiq Mockups)**.
   - Rekomendasi uang muka (DP) otomatis dan tombol langsung ke WhatsApp dengan pesan terformat.

2. **🔍 Live Order Tracker (Pelacak Status Pesanan):**
   - Transparansi pengerjaan penuh: Klien cukup memasukkan **Kode Order** (misal: `JT-2610-A1B2`) atau **Nomor WhatsApp**.
   - Indikator progres visual dengan 5 tahapan pengerjaan (Konsultasi $\rightarrow$ Analisis $\rightarrow$ Koding $\rightarrow$ Demo $\rightarrow$ Selesai).
   - Link preview demo aplikasi & form pengajuan revisi terintegrasi.

3. **📝 Formulir Order & Upload Dokumen:**
   - Klien dapat langsung mengunggah file panduan tugas/soal/jurnal acuan (PDF/ZIP).
   - Kode order unik digenerate secara otomatis dan tersimpan ke database.

4. **⭐ Testimoni & Review Klien:**
   - Kartu ulasan kepuasan klien dilengkapi rating bintang dan tag pencapaian (misal: *Lulus Sidang Nilai A*, *Bisnis UMKM*).

5. **🛠️ Stack Teknologi yang Didukung:**
   - **Bahasa:** Python, Java, C++, PHP, SQL
   - **Framework:** Laravel, Next.js, Django, React, FastAPI
   - **Design & Tools:** Balsamiq Mockups (Wireframing), Git, Docker

---

## 📁 Struktur Direktori Proyek

```
RizofaraTechnology/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── calculator.py   # Logika kalkulator harga & estimasi deadline
│   │   │   │   ├── orders.py       # API order, tracking, upload file, revisi
│   │   │   │   └── contact.py      # Generator link WhatsApp profesional
│   │   │   └── api.py              # Router agregator API v1
│   │   ├── core/
│   │   │   └── config.py           # Konfigurasi aplikasi & environment
│   │   ├── db/
│   │   │   ├── session.py          # Session database SQLAlchemy
│   │   │   └── base.py             # Base metadata tabel
│   │   ├── models/
│   │   │   └── order.py            # Model database: Order, OrderFile, Revision
│   │   ├── schemas/
│   │   │   └── order.py            # Pydantic schemas (validasi request/response)
│   │   └── main.py                 # FastAPI entry point & penyaji frontend
│   ├── uploads/                    # Folder penyimpanan berkas panduan klien
│   ├── requirements.txt            # Dependensi Python
│   ├── run.py                      # Script peluncur server backend
│   └── .env.example                # Template konfigurasi environment
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Komponen utama (Hero, Katalog, Kalkulator, Tracker, Modal)
│   │   ├── main.jsx                # Entry point React
│   │   └── index.css               # Styling Tailwind CSS & custom design
│   ├── package.json                # Dependensi NPM (React, Lucide, Tailwind, Axios)
│   ├── tailwind.config.js          # Konfigurasi Tailwind CSS
│   └── vite.config.js              # Konfigurasi Vite
│
├── JALANKAN_WEBSITE.bat            # Script 1-klik untuk menjalankan website di Windows
├── .gitignore                      # Mengabaikan file sensitif & folder besar (venv, node_modules)
└── README.md                       # Dokumentasi resmi proyek
```

---

## ⚡ Cara Menjalankan Proyek

### Cara 1: Menggunakan Script 1-Klik (Windows)
1. Pastikan Anda berada di folder proyek:
2. Dobel klik file **`JALANKAN_WEBSITE.bat`**.
3. Server otomatis menyala dan browser akan terbuka di:
   👉 **http://127.0.0.1:8000**

---

### Cara 2: Instalasi & Menjalankan Manual (Fresh Clone dari GitHub)

#### 1. Clone Repository:
```bash
git clone https://github.com/SofiaAzzahra09/WebsiteFreelance.git
cd WebsiteFreelance
```

#### 2. Setup Backend (Python):
```bash
cd backend
python -m venv venv

# Mengaktifkan venv:
# Di Windows:
.\venv\Scripts\activate
# Di Linux/macOS:
source venv/bin/activate

# Instal dependensi:
pip install -r requirements.txt

# Salin konfigurasi environment:
cp .env.example .env
```

#### 3. Setup Frontend (React Vite):
```bash
cd ../frontend
npm install
npm run build
```

#### 4. Jalankan Aplikasi:
```bash
cd ../backend
python run.py
```
* **Akses Website:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Dokumentasi API Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## ⚙️ Konfigurasi Environment (`backend/.env`)

| Variabel | Deskripsi | Default / Contoh |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Nama brand platform | `"Rizofara Technology"` |
| `DATABASE_URL` | URL koneksi database | `"sqlite:///./app.db"` |
| `WHATSAPP_ADMIN_NUMBER` | Nomor WA admin bisnis | `"6285692390483"` |
| `TELEGRAM_BOT_TOKEN` | Token Bot Telegram (opsional) | `""` |
| `TELEGRAM_CHAT_ID` | Chat ID Telegram untuk notif order | `""` |

---

## 👥 Tim & Pembagian Tugas (Co-Founders)

| Peran | Fokus Utama |
| :--- | :--- |
| **Founder 1 (Lead Tech & AI)** | Arsitektur backend FastAPI, database, pengerjaan skripsi AI/Machine Learning, Python, dan Chatbot. |
| **Founder 2 (Frontend & Client Ops)** | UI/UX desain Tailwind, komunikasi dan closing klien via WhatsApp, pengerjaan project Web (React, Laravel), QA. |

---

## 📄 Lisensi
Hak Cipta © 2026 **Rizofara Technology**. Seluruh hak cipta dilindungi undang-undang.
