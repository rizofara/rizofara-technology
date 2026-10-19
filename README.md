# Rizofara Technology - Digital Roots for a Brighter Tomorrow (v2.0)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)

Platform manajemen order, kalkulator harga dinamis, dan Content Management System (CMS) untuk layanan asistensi perangkat lunak akademik (tugas kuliah, program skripsi IT) serta solusi software house komersial (pembuatan website custom, chatbot AI, dan wireframing UI/UX).

---

## Arsitektur & Fitur Utama (v2.0)

1. **Autentikasi JWT & Role-Based Access Control (RBAC):**
   - Portal Admin terproteksi dengan hashing password `PBKDF2-SHA256` dan token `JWT (HS256)`.
   - Pembagian hak akses antara `superadmin` (akses penuh pengaturan bisnis, manajemen tim admin, hapus order, dan backup database) dan `admin` operasional.
   - Fitur CRUD Profil Admin, manajemen anggota tim Co-Founder, dan ganti password mandiri.

2. **Mesin Kalkulator Harga & Katalog Layanan Dinamis:**
   - Seluruh layanan, harga dasar (`min`/`max`), durasi standar/minimum, faktor pengali kompleksitas & platform, serta fasilitas tambahan (*add-ons*) disimpan di database dan dapat dikelola penuh dari Dashboard Admin.
   - Perhitungan harga dilakukan secara deterministik di sisi server (*Single Source of Truth*) dengan pembulatan ke kelipatan Rp 50.000 terdekat dan penyimpanan *pricing snapshot* saat order dibuat.

3. **Manajemen Siklus Order, Milestone Bobot, & Buku Kas Pembayaran:**
   - Pelacakan progres berbasis checklist *milestone* berbobot otomatis (0-100%) dan log riwayat pengerjaan (*timeline updates*).
   - Buku kas pencatatan pembayaran bertahap (DP, Termin, Pelunasan) beserta aturan bisnis yang mengunci status `completed` hingga seluruh tagihan berstatus `paid` (Lunas).
   - Penyimpanan berkas klien di direktori privat (`storage/private/`) yang hanya dapat diunduh melalui endpoint terautentikasi.

4. **Pelacakan Order Publik Privasi-Aman & Moderasi Testimoni:**
   - Pelacakan pesanan wajib menggunakan kecocokan persis (*exact match*) **Kode Order** (`RZ-YYMM-XXXX`) dan **4 digit terakhir nomor WhatsApp** dengan penyamaran nama klien otomatis (*privacy masking*).
   - Klien dengan pesanan selesai (`completed`) dapat mengirim ulasan langsung dari halaman pelacakan dengan alur moderasi (`pending` -> `approved` / `rejected`).
   - Katalog portofolio dilengkapi bendera izin publikasi klien (`client_consent`).

5. **CMS Pengaturan Situs, Keamanan HTTP, & Hot-Backup Database:**
   - Pengaturan nama brand, nomor WhatsApp utama (normalisasi otomatis `628xx`), konten Hero, FAQ, dan daftar keahlian teknologi (*Tech Stack*) secara langsung dari Dashboard Admin.
   - Dilengkapi *Security Headers Middleware* (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`), *Sliding Window Rate Limiter* untuk proteksi login/tracking, endpoint SEO (`/robots.txt` & `/sitemap.xml`), serta fitur *Hot-Backup SQLite* dengan retensi otomatis 14 snapshot.

---

## Struktur Direktori Proyek

```text
WebsiteFreelance/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/          # Endpoint: auth, services, calculator, orders, showcase, cms, contact
│   │   │   ├── deps.py             # Dependency injection JWT & RBAC (get_current_admin, require_superadmin)
│   │   │   └── api.py              # Router agregator API v1
│   │   ├── core/
│   │   │   ├── config.py           # Konfigurasi environment & direktori storage
│   │   │   ├── security.py         # Utilitas PBKDF2-SHA256 & JWT
│   │   │   ├── security_middleware.py # Middleware Security Headers & Sliding Window Rate Limiter
│   │   │   └── validators.py       # Validasi ekstensi, ukuran, dan magic bytes file upload
│   │   ├── db/                     # Koneksi SQLAlchemy & Base ORM
│   │   ├── models/                 # Model ORM: AdminUser, ServiceCatalog, Order, Showcase, CMS
│   │   ├── schemas/                # Skema validasi Pydantic v2
│   │   ├── services/
│   │   │   ├── backup.py           # Layanan Hot-Backup SQLite & rotasi 14 file
│   │   │   └── notifications.py    # Integrasi notifikasi Telegram & generator WhatsApp
│   │   ├── seed.py                 # Seeder otomatis akun admin, harga, portofolio, dan CMS
│   │   └── main.py                 # Entry point FastAPI, SEO endpoints, & static SPA server
│   ├── storage/
│   │   ├── backups/                # Snapshot cadangan database SQLite
│   │   ├── private/                # Berkas rahasia tugas/skripsi klien & bukti bayar
│   │   └── public/media/           # Media publik portofolio
│   ├── tests/                      # 6 modul pengujian integrasi otomatis (pytest)
│   ├── requirements.txt            # Dependensi Python
│   └── run.py                      # Script peluncur server backend
│
├── frontend/
│   ├── public/
│   │   └── favicon.png             # Logo & ikon resmi Rizofara Technology
│   ├── src/
│   │   ├── components/             # Modul Portal Admin (Order, Pricing, Showcase, CMS)
│   │   ├── App.jsx                 # Komponen utama aplikasi publik
│   │   ├── main.jsx                # Entry point React
│   │   └── index.css               # Styling Tailwind CSS
│   ├── package.json                # Dependensi NPM
│   └── vite.config.js              # Konfigurasi Vite
│
├── docs/
│   └── PRD.md                      # Dokumen Analisis Sistem & Product Requirements Document (PRD)
├── JALANKAN_WEBSITE.bat            # Script 1-klik untuk menyalakan server di Windows
└── README.md                       # Dokumentasi resmi proyek
```

---

## Cara Menjalankan Proyek di Localhost

### 1. Menjalankan Backend (FastAPI - Port 8000)
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **API & Production Bundle:** `http://127.0.0.1:8000`
- **Swagger UI (Dokumentasi API):** `http://127.0.0.1:8000/docs`

### 2. Menjalankan Frontend Development Server (Vite - Port 5173)
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- **Akses Frontend Dev Server:** `http://localhost:5173`

### 3. Akun Default Portal Admin (Otomatis Dibuat oleh Seeder)
- **Superadmin:** `admin@rizofara.com` / Password: `Admin123!`
- **Admin Operasional:** `ops@rizofara.com` / Password: `Admin123!`

---

## Menjalankan Pengujian Otomatis (`pytest`)

Seluruh modul dari Fase 0 hingga Fase 6 dilengkapi pengujian integrasi otomatis:
```powershell
cd backend
python -m pytest -v
```

---

## Lisensi
Hak Cipta © 2026 **Rizofara Technology**. Seluruh hak cipta dilindungi undang-undang.
