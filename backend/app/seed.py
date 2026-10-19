from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.admin_user import AdminUser
from app.models.pricing import ServiceCatalog, PricingFactor, PricingAddon
from app.models.showcase import Testimonial, PortfolioItem
from app.models.cms import SiteSetting, FaqItem, TechStackItem
from app.core.security import hash_password


def seed_initial_admins(db: Session) -> None:
    """
    Membuat akun Co-Founder default jika tabel `admin_users` masih kosong.
    Dengan begitu, saat aplikasi pertama kali dijalankan, Founder bisa langsung login
    dan kemudian mengubah email/password melalui menu Profil Admin.
    """
    existing_count = db.query(AdminUser).count()
    if existing_count > 0:
        return

    default_admins = [
        AdminUser(
            name="Founder 1 (Lead Tech & AI)",
            email="admin@rizofara.com",
            password_hash=hash_password("Admin123!"),
            role="superadmin",
            title="Co-Founder — Lead Tech & AI",
            bio="Fokus pada arsitektur backend FastAPI, database, skripsi AI/Machine Learning, Python, dan Chatbot.",
            whatsapp="6285692390483",
            is_active=True,
        ),
        AdminUser(
            name="Founder 2 (Frontend & Client Ops)",
            email="ops@rizofara.com",
            password_hash=hash_password("Admin123!"),
            role="admin",
            title="Co-Founder — Frontend & Client Ops",
            bio="Fokus pada UI/UX desain Tailwind, komunikasi dan closing klien via WhatsApp, pengerjaan Web (React, Laravel), & QA.",
            whatsapp="6285692390483",
            is_active=True,
        ),
    ]
    db.add_all(default_admins)
    db.commit()


def seed_initial_pricing(db: Session) -> None:
    """
    Mengisi data awal Katalog Layanan (`services`), Faktor Pengali (`pricing_factors`),
    dan Add-on (`pricing_addons`) jika tabel masih kosong (Modul M3 & M4).
    """
    if db.query(ServiceCatalog).count() == 0:
        default_services = [
            ServiceCatalog(
                slug="tugas",
                name="Tugas Kuliah Pemrograman",
                short_label="Tugas Kuliah",
                description="Solusi cepat & terstruktur untuk tugas harian, kuis praktikum, hingga project UTS/UAS pemrograman berbagai bahasa.",
                features=[
                    "Algoritma, Struktur Data, OOP, & Basis Data",
                    "Web Dasar (HTML/CSS/JS, PHP Native, Laravel, React)",
                    "Python, C/C++, Java, atau Dart",
                    "Komentar Kode Rapi + Penjelasan Cara Kerja",
                ],
                icon="Code2",
                color="teal",
                category="akademik",
                base_price_min=100_000,
                base_price_max=350_000,
                standard_days=3,
                min_days=1,
                max_days=30,
                is_active=True,
                display_order=1,
            ),
            ServiceCatalog(
                slug="skripsi",
                name="Program Skripsi & Tugas Akhir",
                short_label="Skripsi IT",
                description="Pembuatan sistem aplikasi/program Skripsi, Tesis, atau Tugas Akhir lengkap dari perancangan arsitektur hingga siap demo sidang.",
                features=[
                    "Implementasi Algoritma: CNN, YOLO, SAW, TOPSIS, K-Means, Naive Bayes, dll.",
                    "Sistem Informasi Web, Mobile (Flutter), atau Data Science",
                    "Bantuan Instalasi, Setup Database, & Simulasi Sidang",
                    "Garansi Revisi Program Sesuai Catatan Dosen Penguji",
                ],
                icon="GraduationCap",
                color="indigo",
                category="akademik",
                base_price_min=1_800_000,
                base_price_max=3_500_000,
                standard_days=21,
                min_days=5,
                max_days=60,
                is_active=True,
                display_order=2,
            ),
            ServiceCatalog(
                slug="website",
                name="Jasa Pembuatan Website",
                short_label="Website Bisnis",
                description="Pengembangan website profesional, responsif, dan cepat untuk UMKM, Company Profile, Landing Page, hingga Sistem Informasi Kustom.",
                features=[
                    "Desain Modern & Responsif (Mobile-Friendly Tailwind CSS)",
                    "Dashboard Admin CMS untuk Kelola Konten Mandiri",
                    "Optimasi Kecepatan & Struktur Dasar SEO",
                    "Integrasi Tombol WhatsApp, Maps, & Formulir Order",
                ],
                icon="Globe",
                color="emerald",
                category="bisnis",
                base_price_min=1_200_000,
                base_price_max=3_800_000,
                standard_days=14,
                min_days=5,
                max_days=60,
                is_active=True,
                display_order=3,
            ),
            ServiceCatalog(
                slug="chatbot",
                name="Jasa Pembuatan Chatbot",
                short_label="Chatbot AI/WA",
                description="Otomatisasi layanan pelanggan & asisten pintar berbasis WhatsApp, Telegram, atau Web dengan integrasi AI / LLM (RAG).",
                features=[
                    "Integrasi WhatsApp Gateway, Telegram Bot, atau Web Widget",
                    "Berbasis AI Pintar (OpenAI / Gemini / Custom Knowledge Base)",
                    "Auto-Reply FAQ, Katalog Produk, & Pencatatan Pesanan ke DB",
                    "Dashboard Monitoring Percakapan & Handover ke Admin Manusia",
                ],
                icon="Bot",
                color="amber",
                category="bisnis",
                base_price_min=900_000,
                base_price_max=2_800_000,
                standard_days=10,
                min_days=5,
                max_days=45,
                is_active=True,
                display_order=4,
            ),
        ]
        db.add_all(default_services)
        db.commit()

    if db.query(PricingFactor).count() == 0:
        default_factors = [
            # Complexity Factors
            PricingFactor(
                factor_type="complexity",
                code="basic",
                label="Dasar (CRUD)",
                description="Fitur standar input/edit/hapus data tanpa algoritma rumit.",
                multiplier=1.00,
                applicable_services=None,
                is_default=False,
                is_active=True,
                display_order=1,
            ),
            PricingFactor(
                factor_type="complexity",
                code="intermediate",
                label="Menengah",
                description="Multi-role user, laporan grafik/filter, atau metode SPK standar.",
                multiplier=1.30,
                applicable_services=None,
                is_default=True,
                is_active=True,
                display_order=2,
            ),
            PricingFactor(
                factor_type="complexity",
                code="advanced",
                label="Lanjutan (AI/API)",
                description="Integrasi Payment/WA Gateway, Machine Learning, atau API pihak ketiga.",
                multiplier=1.70,
                applicable_services=None,
                is_default=False,
                is_active=True,
                display_order=3,
            ),
            PricingFactor(
                factor_type="complexity",
                code="expert",
                label="Kompleks / Riset",
                description="Deep Learning (CNN/YOLO), kombinasi metode hybrid, atau arsitektur skala besar.",
                multiplier=2.20,
                applicable_services=None,
                is_default=False,
                is_active=True,
                display_order=4,
            ),
            # Platform Factors
            PricingFactor(
                factor_type="platform",
                code="web",
                label="Web",
                description="Aplikasi berbasis browser (React, Laravel, FastAPI, PHP).",
                multiplier=1.00,
                applicable_services=None,
                is_default=True,
                is_active=True,
                display_order=1,
            ),
            PricingFactor(
                factor_type="platform",
                code="mobile",
                label="Mobile (Flutter)",
                description="Aplikasi Android/iOS lintas platform dengan Flutter.",
                multiplier=1.35,
                applicable_services=None,
                is_default=False,
                is_active=True,
                display_order=2,
            ),
            PricingFactor(
                factor_type="platform",
                code="ai_ml",
                label="AI / ML / Data",
                description="Pemrosesan dataset, Computer Vision, NLP, atau LLM Python.",
                multiplier=1.45,
                applicable_services=None,
                is_default=False,
                is_active=True,
                display_order=3,
            ),
            PricingFactor(
                factor_type="platform",
                code="iot",
                label="IoT",
                description="Integrasi mikrokontroler (ESP32/Arduino), sensor, dan dashboard monitoring.",
                multiplier=1.40,
                applicable_services=["skripsi", "tugas"],
                is_default=False,
                is_active=True,
                display_order=4,
            ),
            PricingFactor(
                factor_type="platform",
                code="desktop",
                label="Desktop",
                description="Aplikasi desktop lokal (Python GUI / Java / Electron).",
                multiplier=1.15,
                applicable_services=None,
                is_default=False,
                is_active=True,
                display_order=5,
            ),
        ]
        db.add_all(default_factors)
        db.commit()

    if db.query(PricingAddon).count() == 0:
        default_addons = [
            PricingAddon(
                code="report",
                label="Bantuan Laporan / Bab Pembahasan Program",
                description="Penjelasan alur kode, struktur tabel database, flowchart, dan UML/DFD.",
                price_type="fixed",
                price_min=200_000,
                price_max=400_000,
                benefit_text="Bantuan Penyusunan Laporan / Pembahasan Algoritma & Flowchart",
                applicable_services=["skripsi", "tugas"],
                is_default_checked=True,
                is_active=True,
                display_order=1,
            ),
            PricingAddon(
                code="wireframe",
                label="Desain Wireframe UI/UX (Balsamiq)",
                description="Perancangan sketsa antarmuka layar sebelum masuk tahap koding.",
                price_type="fixed",
                price_min=100_000,
                price_max=250_000,
                benefit_text="Desain Wireframe UI/UX dengan Balsamiq Mockups",
                applicable_services=None,
                is_default_checked=False,
                is_active=True,
                display_order=2,
            ),
        ]
        db.add_all(default_addons)
        db.commit()


def seed_initial_showcase(db: Session) -> None:
    """
    Mengisi data awal Testimoni (`testimonials`) dan Portofolio (`portfolio_items`)
    jika tabel masih kosong (Modul M9 & M10).
    """
    if db.query(Testimonial).count() == 0:
        default_testimonials = [
            Testimonial(
                client_name="Rizky Ananda",
                client_role="Mahasiswa Teknik Informatika",
                project_label="Skripsi AI Klasifikasi Citra CNN",
                tag="Lulus Sidang Nilai A",
                comment="Awalnya pusing banget dospem minta akurasi dinaikkan di atas 90%. Dibantu perbaiki arsitektur model dan dikasih video panduan alur logika program sampai paham detailnya. Pas sidang penguji terkesan!",
                rating=5,
                avatar_initials="RA",
                avatar_color="from-teal-500 to-emerald-600",
                source="admin",
                status="approved",
                is_featured=True,
                consent_publish=True,
                display_order=1,
            ),
            Testimonial(
                client_name="Dimas Saputra",
                client_role="Owner Toko Retail & Fashion",
                project_label="Chatbot WhatsApp AI + Katalog",
                tag="Bisnis UMKM",
                comment="Respon pelanggan jadi otomatis 24 jam nonstop. Admin toko nggak perlu bales manual satu-satu lagi untuk tanya stok dan rekapan invoice. Sangat mempermudah operasional bisnis saya.",
                rating=5,
                avatar_initials="DS",
                avatar_color="from-indigo-500 to-purple-600",
                source="admin",
                status="approved",
                is_featured=True,
                consent_publish=True,
                display_order=2,
            ),
            Testimonial(
                client_name="Mega Febriyanti",
                client_role="Mahasiswi Sistem Informasi",
                project_label="Skripsi SPK Metode TOPSIS & Web",
                tag="Garansi Revisi Cepat",
                comment="Waktu revisi bab 4 dan 5 mepet banget H-3 pendaftaran sidang. Tim gercep bantu perbaiki rumus pembobotan dan tambah fitur export Excel. Komunikasinya ramah dan fast response!",
                rating=5,
                avatar_initials="MF",
                avatar_color="from-amber-500 to-orange-600",
                source="admin",
                status="approved",
                is_featured=True,
                consent_publish=True,
                display_order=3,
            ),
            Testimonial(
                client_name="Aldi Pratama",
                client_role="Mahasiswa Ilmu Komputer",
                project_label="Tugas Besar Pemrograman Python",
                tag="Koding Bersih & Rapi",
                comment="Setiap baris kode dikasih komentar penjelasan, jadi pas dosen tanya 'fungsi baris ini buat apa', aku bisa jawab dengan lancar tanpa ragu. Nilai praktikum dapet 95!",
                rating=5,
                avatar_initials="AP",
                avatar_color="from-cyan-500 to-blue-600",
                source="admin",
                status="approved",
                is_featured=True,
                consent_publish=True,
                display_order=4,
            ),
        ]
        db.add_all(default_testimonials)
        db.commit()

    if db.query(PortfolioItem).count() == 0:
        default_portfolios = [
            PortfolioItem(
                title="Deteksi Penyakit Daun Tanaman dengan Algoritma CNN (ResNet-50) & FastAPI",
                slug="deteksi-penyakit-daun-cnn",
                category="Skripsi AI & Machine Learning",
                badge_color="teal",
                summary="Aplikasi upload gambar berbasis web untuk mendeteksi hama daun secara real-time dengan akurasi 94.2%.",
                content="Sistem klasifikasi citra daun berbasis Convolutional Neural Network (ResNet-50) dengan antarmuka React dan backend FastAPI.",
                tech_tags=["Python", "PyTorch", "FastAPI", "React"],
                highlight_metric="Akurasi 94.2%",
                client_consent=True,
                is_published=True,
                is_featured=True,
                display_order=1,
            ),
            PortfolioItem(
                title="WhatsApp Customer Service AI Terintegrasi Google Gemini & Katalog Produk",
                slug="whatsapp-cs-ai-gemini",
                category="Chatbot & AI LLM",
                badge_color="indigo",
                summary="Bot asisten WhatsApp pintar yang melayani pertanyaan stok barang, rekomendasi produk, dan rekap pesanan otomatis.",
                content="Integrasi WhatsApp Gateway dengan Google Gemini API (RAG) dan database katalog produk PostgreSQL.",
                tech_tags=["Node.js", "Gemini API", "PostgreSQL"],
                highlight_metric="Respon Otomatis 24/7",
                client_consent=True,
                is_published=True,
                is_featured=True,
                display_order=2,
            ),
            PortfolioItem(
                title="Sistem Informasi Inventaris & Kasir (POS) Toko Retail Berbasis Cloud",
                slug="sistem-informasi-pos-retail",
                category="Web & Sistem Informasi",
                badge_color="emerald",
                summary="Web aplikasi pencatatan transaksi kasir, print struk thermal, laporan laba rugi bulanan, dan audit stok opname.",
                content="Aplikasi Point of Sale (POS) lengkap dengan manajemen multi-cabang, cetak struk thermal 58mm, dan export laporan Excel/PDF.",
                tech_tags=["Laravel 11", "Tailwind", "MySQL"],
                highlight_metric="Multi-Role & Print Struk",
                client_consent=True,
                is_published=True,
                is_featured=True,
                display_order=3,
            ),
        ]
        db.add_all(default_portfolios)
        db.commit()


def seed_initial_cms(db: Session) -> None:
    """
    Mengisi data awal Pengaturan Situs (`site_settings`), FAQ (`faqs`),
    dan Tech Stack (`tech_stacks`) jika tabel masih kosong (Modul M2.A & M11).
    """
    if db.query(SiteSetting).count() == 0:
        default_settings = [
            SiteSetting(
                key="brand_name",
                value="Rizofara Technology",
                group="brand",
                description="Nama brand utama di header dan footer",
            ),
            SiteSetting(
                key="tagline",
                value="Digital Roots for a Brighter Tomorrow",
                group="brand",
                description="Slogan di bawah nama brand",
            ),
            SiteSetting(
                key="whatsapp_number",
                value="6285692390483",
                group="contact",
                description="Nomor WhatsApp utama (format 628xxx)",
            ),
            SiteSetting(
                key="hero_badge",
                value="Asistensi Kode Terstruktur • Dokumentasi Lengkap • Wireframe & Panduan Teknis",
                group="hero",
                description="Teks lencana di bagian atas Hero",
            ),
            SiteSetting(
                key="hero_title",
                value="Pengembangan Sistem Skripsi IT,",
                group="hero",
                description="Baris pertama judul Hero",
            ),
            SiteSetting(
                key="hero_highlight",
                value="Aplikasi Web & Chatbot AI",
                group="hero",
                description="Teks sorotan utama di judul Hero",
            ),
            SiteSetting(
                key="hero_subtitle",
                value="Dirancang dan dikerjakan oleh tim software engineer. Setiap proyek dilengkapi source code yang terstruktur, dokumentasi arsitektur, serta sesi penjelasan alur program.",
                group="hero",
                description="Paragraf sub-judul di bagian Hero",
            ),
            SiteSetting(
                key="payment_bank_info",
                value="BCA / Mandiri / Gopay / Dana / QRIS (Hubungi Admin untuk Nomor Rekening Resmi)",
                group="payment",
                description="Informasi metode pembayaran resmi",
            ),
        ]
        db.add_all(default_settings)
        db.commit()

    if db.query(FaqItem).count() == 0:
        default_faqs = [
            FaqItem(
                question="Bagaimana ketentuan revisi jika ada catatan dari dosen pembimbing atau penguji?",
                answer="Kami memberikan garansi revisi tanpa biaya tambahan selama poin perbaikan masih berada dalam ruang lingkup (scope) fitur dan spesifikasi awal yang disepakati.",
                category="revisi",
                is_published=True,
                display_order=1,
            ),
            FaqItem(
                question="Apakah disertakan panduan instalasi dan penjelasan alur kode?",
                answer="Setiap penyerahan proyek mencakup panduan instalasi di perangkat Anda, dokumentasi README, serta penjelasan struktur database dan logika program untuk persiapan sidang.",
                category="umum",
                is_published=True,
                display_order=2,
            ),
            FaqItem(
                question="Bagaimana tahapan pembayaran yang berlaku?",
                answer="Pembayaran diawali dengan uang muka (DP) sebesar 30% hingga 40% setelah spesifikasi disepakati. Pelunasan dilakukan setelah sistem didemokan dan berjalan sesuai kesepakatan.",
                category="pembayaran",
                is_published=True,
                display_order=3,
            ),
            FaqItem(
                question="Bagaimana kebijakan privasi data dan identitas klien?",
                answer="Identitas klien, instansi atau kampus, serta dokumen penelitian bersifat rahasia dan tidak dipublikasikan ke halaman portofolio tanpa persetujuan klien.",
                category="privasi",
                is_published=True,
                display_order=4,
            ),
        ]
        db.add_all(default_faqs)
        db.commit()

    if db.query(TechStackItem).count() == 0:
        default_techs = [
            TechStackItem(name="Python", emoji="PY", color="text-teal-400", is_highlighted=False, is_published=True, display_order=1),
            TechStackItem(name="Java", emoji="JV", color="text-slate-200", is_highlighted=False, is_published=True, display_order=2),
            TechStackItem(name="C++", emoji="CPP", color="text-slate-200", is_highlighted=False, is_published=True, display_order=3),
            TechStackItem(name="PHP", emoji="PHP", color="text-slate-200", is_highlighted=False, is_published=True, display_order=4),
            TechStackItem(name="SQL", emoji="SQL", color="text-teal-400", is_highlighted=False, is_published=True, display_order=5),
            TechStackItem(name="Laravel", emoji="LRV", color="text-slate-200", is_highlighted=False, is_published=True, display_order=6),
            TechStackItem(name="Next.js", emoji="NXT", color="text-slate-200", is_highlighted=False, is_published=True, display_order=7),
            TechStackItem(name="Django", emoji="DJ", color="text-teal-400", is_highlighted=False, is_published=True, display_order=8),
            TechStackItem(name="Balsamiq Wireframe", emoji="UI", color="text-teal-300", is_highlighted=True, is_published=True, display_order=9),
        ]
        db.add_all(default_techs)
        db.commit()


def run_startup_seed() -> None:
    """Menjalankan seeder awal saat aplikasi menyala."""
    db = SessionLocal()
    try:
        seed_initial_admins(db)
        seed_initial_pricing(db)
        seed_initial_showcase(db)
        seed_initial_cms(db)
    finally:
        db.close()
