from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.admin_user import AdminUser
from app.models.pricing import ServiceCatalog, PricingFactor, PricingAddon
from app.models.showcase import Testimonial, PortfolioItem
from app.models.cms import SiteSetting, FaqItem, TechStackItem
from app.models.order import Order, OrderMilestone, OrderTimelineLog, OrderPayment, Revision
from app.core.security import hash_password
from app.models.role import Role, DEFAULT_ROLES, ALL_PERMISSIONS


def ensure_sqlite_schema_columns(db: Session) -> None:
    # Hanya jalankan jika dialect adalah sqlite (bukan PostgreSQL Supabase)
    if db.bind.dialect.name != "sqlite":
        return

    """
    Memastikan tabel `orders` dan `revisions` pada file SQLite lama (`app.db`)
    memiliki seluruh kolom terbaru (Fase 3-6) melalui ALTER TABLE otomatis jika belum ada.
    """
    order_columns = {
        "campus_or_company": "VARCHAR(100)",
        "price_estimate_max": "INTEGER DEFAULT 0",
        "final_price": "INTEGER DEFAULT 0",
        "discount_amount": "INTEGER DEFAULT 0",
        "pricing_snapshot": "JSON",
        "source": "VARCHAR(30) DEFAULT 'web'",
        "cancel_reason": "TEXT",
        "completed_at": "DATETIME",
        "updated_at": "DATETIME",
    }
    existing_order_cols = {
        row[1] for row in db.execute(text("PRAGMA table_info(orders)")).fetchall()
    }
    for col_name, col_def in order_columns.items():
        if existing_order_cols and col_name not in existing_order_cols:
            db.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_def}"))

    revision_columns = {
        "admin_response": "TEXT",
        "is_out_of_scope": "BOOLEAN DEFAULT 0",
        "extra_cost": "INTEGER DEFAULT 0",
        "resolved_at": "DATETIME",
    }
    existing_rev_cols = {
        row[1] for row in db.execute(text("PRAGMA table_info(revisions)")).fetchall()
    }
    for col_name, col_def in revision_columns.items():
        if existing_rev_cols and col_name not in existing_rev_cols:
            db.execute(text(f"ALTER TABLE revisions ADD COLUMN {col_name} {col_def}"))

    db.commit()



def seed_initial_roles(db: Session) -> None:
    """
    Memastikan role bawaan sistem (superadmin, admin, freelance) selalu tersedia di tabel `roles`.
    Role yang sudah ada tidak ditimpa agar perubahan permission oleh Superadmin tetap tersimpan.
    """
    for name, cfg in DEFAULT_ROLES.items():
        exists = db.query(Role).filter(Role.name == name).first()
        if exists:
            if name == "superadmin":
                exists.permissions = list(ALL_PERMISSIONS)
            continue
        db.add(
            Role(
                name=name,
                display_name=cfg["display_name"],
                description=cfg["description"],
                permissions=list(cfg["permissions"]),
                is_system=cfg["is_system"],
                is_active=True,
            )
        )
    db.commit()


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
            title="Co-Founder - Lead Tech & AI",
            bio="Fokus pada arsitektur backend FastAPI, database, skripsi AI/Machine Learning, Python, dan Chatbot.",
            whatsapp="6285141396021",
            is_active=True,
        ),
        AdminUser(
            name="Founder 2 (Frontend & Client Ops)",
            email="ops@rizofara.com",
            password_hash=hash_password("Admin123!"),
            role="admin",
            title="Co-Founder - Frontend & Client Ops",
            bio="Fokus pada UI/UX desain Tailwind, komunikasi dan closing klien via WhatsApp, pengerjaan Web (React, Laravel), & QA.",
            whatsapp="6285141396021",
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
                value="Digital roots endless possibilities",
                group="brand",
                description="Slogan di bawah nama brand",
            ),
            SiteSetting(
                key="whatsapp_number",
                value="6285141396021",
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
            SiteSetting(
                key="company_values",
                value='[{"id": 1, "name": "Growth Mindset", "desc": "Terus belajar, berkembang menghadapi kemajuan teknologi terbaru, dan selalu terbuka pada solusi kreatif."}, {"id": 2, "name": "Innovation", "desc": "Mengembangkan arsitektur perangkat lunak dan implementasi AI yang relevan, mutakhir, dan berdampak nyata."}, {"id": 3, "name": "Never Give Up", "desc": "Tangguh menuntaskan setiap tantangan koding, perbaikan bug rumit, hingga bimbingan sidang selesai beres."}, {"id": 4, "name": "Integrity", "desc": "Kejujuran penuh dalam kesepakatan scope, kerahasiaan data terjamin aman, dan orisinalitas kode terjaga."}, {"id": 5, "name": "Collaborative", "desc": "Komunikasi solutif, mendengar masukan klien dan dosen penguji, serta bermitra erat selama pengerjaan."}, {"id": 6, "name": "Good services", "desc": "Pelayanan ramah, responsif, bergaransi revisi, serta pendampingan pemahaman logika sistem secara tuntas."}, {"id": 7, "name": "Transparent", "desc": "Alur kerja terbuka per Bab, estimasi biaya jelas tanpa biaya tersembunyi, dan progres dapat dipantau real-time."}]',
                group="about",
                description="7 Nilai Budaya Perusahaan Rizofara",
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


def seed_initial_orders(db: Session) -> None:
    """
    Mengisi 3 contoh data Order awal lengkap dengan tahapan Bab Skripsi / Modul,
    persentase progres, riwayat timeline, dan pencatatan pembayaran jika tabel `orders` masih kosong.
    """
    if db.query(Order).count() > 0:
        return

    # 1. Order Skripsi IT - Sedang Mengerjakan Bab 4 (Progres 65%)
    o1 = Order(
        order_code="RZ-2610-SKR1",
        client_name="Ahmad Fauzi",
        client_whatsapp="6281234567890",
        client_email="ahmad.fauzi@student.ac.id",
        campus_or_company="Universitas Brawijaya (Teknik Informatika)",
        service_type="skripsi",
        tech_stack="Python, PyTorch, FastAPI, React",
        title="Klasifikasi Penyakit Daun Padi Menggunakan Algoritma CNN ResNet-50 & FastAPI",
        description="Pembuatan sistem deteksi penyakit daun padi berbasis web lengkap dengan pelatihan model CNN, tabel confusion matrix, flowchart, dan penyusunan Bab 3 & Bab 4.",
        deadline="14 Hari",
        price_estimate=2750000,
        price_estimate_max=4500000,
        final_price=3200000,
        discount_amount=200000,
        dp_amount=1200000,
        status="in_progress",
        progress_percent=65,
        assigned_to="Founder 1 (Lead Tech & AI)",
        demo_url="https://demo.rizofara.com/cnn-padi",
        internal_notes="Dosen pembimbing meminta grafik perbandingan epoch 10, 25, dan 50 di Bab 4.",
        source="web",
    )
    db.add(o1)
    db.flush()

    db.add_all([
        OrderMilestone(
            order_id=o1.id,
            title="Bab 1 & 2 - Analisis Masalah, Dataset Citra & Studi Literatur",
            description="Pengumpulan 2.400 citra daun padi (4 kelas) dan perumusan arsitektur sistem.",
            weight_percent=15,
            is_completed=True,
            display_order=1,
        ),
        OrderMilestone(
            order_id=o1.id,
            title="Bab 3 - Perancangan Arsitektur CNN, Flowchart, DFD & Wireframe",
            description="Penyusunan flowchart preprocessing, arsitektur ResNet-50, dan desain UI Balsamiq.",
            weight_percent=25,
            is_completed=True,
            display_order=2,
        ),
        OrderMilestone(
            order_id=o1.id,
            title="Bab 4 (Bagian 1) - Training Model PyTorch & Evaluasi Confusion Matrix",
            description="Pelatihan model mencapai akurasi validasi 94.6% beserta grafik loss/accuracy.",
            weight_percent=25,
            is_completed=True,
            display_order=3,
        ),
        OrderMilestone(
            order_id=o1.id,
            title="Bab 4 (Bagian 2) - Integrasi Web FastAPI & Penulisan Pembahasan Program",
            description="Menghubungkan model .pt ke endpoint prediksi FastAPI dan menyusun naskah Bab 4.",
            weight_percent=20,
            is_completed=False,
            display_order=4,
        ),
        OrderMilestone(
            order_id=o1.id,
            title="Bab 5 - Pengujian Blackbox, Video Panduan & Persiapan Sidang",
            description="Uji coba fungsionalitas sistem bersama klien dan pembuatan video tutorial instalasi.",
            weight_percent=15,
            is_completed=False,
            display_order=5,
        ),
    ])
    db.add_all([
        OrderTimelineLog(
            order_id=o1.id,
            title="Pesanan Diterima & DP Terverifikasi",
            message="Order RZ-2610-SKR1 dikonfirmasi. DP sebesar Rp 1.200.000 telah diterima.",
            progress_percent=15,
            is_public=True,
            created_by="Founder 1 (Lead Tech & AI)",
        ),
        OrderTimelineLog(
            order_id=o1.id,
            title="Selesai Bab 3 - Perancangan Flowchart & Arsitektur",
            message="Perancangan Bab 3 (Flowchart, Struktur Tabel, & Desain Antarmuka) telah selesai.",
            progress_percent=40,
            is_public=True,
            created_by="Founder 1 (Lead Tech & AI)",
        ),
        OrderTimelineLog(
            order_id=o1.id,
            title="Update Progres Bab 4 (65%)",
            message="Sedang mengerjakan Bab 4: Integrasi model CNN (akurasi 94.6%) ke halaman Web FastAPI & penyusunan tabel pengujian Blackbox.",
            progress_percent=65,
            is_public=True,
            created_by="Founder 1 (Lead Tech & AI)",
        ),
    ])
    db.add(
        OrderPayment(
            order_id=o1.id,
            payment_type="dp",
            amount=1200000,
            method="transfer_bank",
            reference_note="DP 40% via BCA a.n. Ahmad Fauzi",
            status="verified",
            verified_by="Founder 1 (Lead Tech & AI)",
        )
    )

    # 2. Order Website Komersial - Tahap Perancangan Database & UI/UX (Progres 40%)
    o2 = Order(
        order_code="RZ-2610-WEB2",
        client_name="Siti Rahmawati",
        client_whatsapp="6285711223344",
        client_email="owner@kopinusantara.id",
        campus_or_company="UMKM Kopi Nusantara",
        service_type="website",
        tech_stack="Laravel 11, Tailwind CSS, MySQL",
        title="Sistem Informasi Kasir POS & Inventaris Gudang Multi-Cabang",
        description="Aplikasi web kasir thermal print, manajemen stok bahan baku otomatis, dan laporan laba rugi bulanan.",
        deadline="21 Hari",
        price_estimate=2200000,
        price_estimate_max=3800000,
        final_price=2500000,
        discount_amount=0,
        dp_amount=1000000,
        status="in_progress",
        progress_percent=40,
        assigned_to="Founder 2 (Frontend & Client Ops)",
        internal_notes="Tambahkan fitur export laporan penjualan ke format Excel dan PDF.",
        source="whatsapp",
    )
    db.add(o2)
    db.flush()

    db.add_all([
        OrderMilestone(
            order_id=o2.id,
            title="Tahap 1 - Analisis Kebutuhan Bisnis & Verifikasi DP",
            description="Pemetaan alur kasir, hak akses kasir vs manajer, dan konfirmasi DP.",
            weight_percent=15,
            is_completed=True,
            display_order=1,
        ),
        OrderMilestone(
            order_id=o2.id,
            title="Tahap 2 - Perancangan Skema Database MySQL & Wireframe UI/UX",
            description="Pembuatan relasi tabel produk, mutasi stok, dan desain dashboard kasir.",
            weight_percent=25,
            is_completed=True,
            display_order=2,
        ),
        OrderMilestone(
            order_id=o2.id,
            title="Tahap 3 - Pengembangan Modul Transaksi POS & Laporan Keuangan",
            description="Implementasi fitur keranjang kasir, cetak struk thermal 58mm, dan rekap stok.",
            weight_percent=40,
            is_completed=False,
            display_order=3,
        ),
        OrderMilestone(
            order_id=o2.id,
            title="Tahap 4 - Pengujian UAT, Deployment Server & Serah Terima",
            description="Uji coba bersama pemilik toko dan instalasi di hosting produksi.",
            weight_percent=20,
            is_completed=False,
            display_order=4,
        ),
    ])
    db.add_all([
        OrderTimelineLog(
            order_id=o2.id,
            title="Update Progres Tahap 3 (40%)",
            message="Sedang mengerjakan Tahap 3: Pengembangan modul transaksi Kasir POS, potong stok otomatis, & cetak struk.",
            progress_percent=40,
            is_public=True,
            created_by="Founder 2 (Frontend & Client Ops)",
        ),
    ])
    db.add(
        OrderPayment(
            order_id=o2.id,
            payment_type="dp",
            amount=1000000,
            method="qris",
            reference_note="DP Awal QRIS Kopi Nusantara",
            status="verified",
            verified_by="Founder 2 (Frontend & Client Ops)",
        )
    )

    # 3. Order Tugas / Skripsi SPK - Selesai 100% & Lunas
    o3 = Order(
        order_code="RZ-2610-SPK3",
        client_name="Bagas Pratama",
        client_whatsapp="6281399887766",
        client_email="bagas.p@campus.ac.id",
        campus_or_company="Universitas Diponegoro (Sistem Informasi)",
        service_type="skripsi",
        tech_stack="PHP Laravel, MySQL, Bootstrap",
        title="Sistem Pendukung Keputusan Pemilihan Supplier Terbaik Metode TOPSIS",
        description="Aplikasi SPK metode TOPSIS lengkap dengan perhitungan matriks ternormalisasi, solusi ideal positif/negatif, dan laporan Bab 4.",
        deadline="10 Hari",
        price_estimate=1800000,
        price_estimate_max=3000000,
        final_price=2000000,
        discount_amount=0,
        dp_amount=2000000,
        status="completed",
        progress_percent=100,
        assigned_to="Founder 2 (Frontend & Client Ops)",
        demo_url="https://demo.rizofara.com/spk-topsis",
        source="web",
    )
    db.add(o3)
    db.flush()

    db.add_all([
        OrderMilestone(
            order_id=o3.id,
            title="Bab 1 & 2 - Analisis Kriteria & Bobot Preferensi TOPSIS",
            weight_percent=15,
            is_completed=True,
            display_order=1,
        ),
        OrderMilestone(
            order_id=o3.id,
            title="Bab 3 - Perancangan Database & Perhitungan Manual Excel",
            weight_percent=25,
            is_completed=True,
            display_order=2,
        ),
        OrderMilestone(
            order_id=o3.id,
            title="Bab 4 - Implementasi Kode Program SPK TOPSIS & Export PDF",
            weight_percent=40,
            is_completed=True,
            display_order=3,
        ),
        OrderMilestone(
            order_id=o3.id,
            title="Bab 5 - Finalisasi Laporan Pembahasan & Serah Terima Source Code",
            weight_percent=20,
            is_completed=True,
            display_order=4,
        ),
    ])
    db.add(
        OrderTimelineLog(
            order_id=o3.id,
            title="Proyek Selesai 100% - Seluruh Bab 1 s/d Bab 5 Tuntas",
            message="Seluruh source code, file perhitungan Excel TOPSIS, laporan Bab 4, dan video panduan instalasi telah diserahkan.",
            progress_percent=100,
            is_public=True,
            created_by="Founder 2 (Frontend & Client Ops)",
        )
    )
    db.add_all([
        OrderPayment(
            order_id=o3.id,
            payment_type="dp",
            amount=800000,
            method="transfer_bank",
            reference_note="DP 40% Mandiri",
            status="verified",
            verified_by="Founder 2 (Frontend & Client Ops)",
        ),
        OrderPayment(
            order_id=o3.id,
            payment_type="final",
            amount=1200000,
            method="transfer_bank",
            reference_note="Pelunasan 60% Mandiri",
            status="verified",
            verified_by="Founder 2 (Frontend & Client Ops)",
        ),
    ])

    db.commit()


def run_startup_seed() -> None:
    """Menjalankan migrasi kolom otomatis dan seeder awal saat aplikasi menyala."""
    db = SessionLocal()
    try:
        ensure_sqlite_schema_columns(db)
        seed_initial_roles(db)
        seed_initial_admins(db)
        seed_initial_pricing(db)
        seed_initial_showcase(db)
        seed_initial_cms(db)
        seed_initial_orders(db)
    finally:
        db.close()

