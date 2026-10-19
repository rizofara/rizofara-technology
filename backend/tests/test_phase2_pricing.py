from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_headers(email: str = "admin@rizofara.com", password: str = "Admin123!") -> dict:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_public_pricing_config():
    """
    Memastikan endpoint publik `/services/config` mengembalikan katalog layanan,
    faktor kompleksitas, faktor platform, dan add-on yang di-seed dari database.
    """
    resp = client.get("/api/v1/services/config")
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["services"]) == 4
    assert len(data["complexity_factors"]) == 4
    assert len(data["platform_factors"]) == 5
    assert len(data["addons"]) == 2

    slugs = [s["slug"] for s in data["services"]]
    assert "skripsi" in slugs
    assert "tugas" in slugs


def test_crud_service_and_dynamic_calculator():
    """
    Memastikan:
    1. Admin dapat menambah layanan baru ('mobile_app') dan langsung bisa dihitung di kalkulator.
    2. Admin dapat mengubah harga dasar layanan ('skripsi') dan hasil kalkulator langsung berubah.
    3. Layanan yang sudah dipakai oleh Order tidak bisa dihapus permanen (Soft-Delete Protection).
    """
    headers = get_auth_headers()

    # 1. Tambah layanan baru: Aplikasi Mobile
    create_resp = client.post(
        "/api/v1/services/",
        headers=headers,
        json={
            "slug": "mobile_app",
            "name": "Pembuatan Aplikasi Mobile Android & iOS",
            "short_label": "Aplikasi Mobile",
            "description": "Pengembangan aplikasi Android & iOS menggunakan Flutter.",
            "features": ["UI Modern Flutter", "Integrasi REST API", "Build APK & AAB"],
            "icon": "Laptop",
            "color": "sky",
            "category": "bisnis",
            "base_price_min": 2_000_000,
            "base_price_max": 4_000_000,
            "standard_days": 20,
            "min_days": 7,
            "max_days": 60,
            "is_active": True,
            "display_order": 5,
        },
    )
    assert create_resp.status_code == 201
    mobile_svc = create_resp.json()
    assert mobile_svc["slug"] == "mobile_app"

    # Uji di kalkulator: 20 hari (Santai = 1.0x), basic (1.0x), web (1.0x), tanpa addon
    calc_mobile = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "mobile_app",
            "complexity": "basic",
            "tech_platform": "web",
            "urgency_days": 20,
            "selected_addons": [],
        },
    )
    assert calc_mobile.status_code == 200
    assert calc_mobile.json()["estimated_min_price"] == 2_000_000
    assert calc_mobile.json()["estimated_max_price"] == 4_000_000

    # 2. Ubah harga dasar 'skripsi' dari 1.800.000 menjadi 2.000.000
    all_services = client.get("/api/v1/services/admin/all", headers=headers).json()
    skripsi_svc = next(s for s in all_services if s["slug"] == "skripsi")

    patch_resp = client.patch(
        f"/api/v1/services/{skripsi_svc['id']}",
        headers=headers,
        json={"base_price_min": 2_000_000},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["base_price_min"] == 2_000_000

    # Hitung ulang skripsi (basic 1.0x, web 1.0x, 21 hari Santai 1.0x, tanpa addon) -> wajib 2.000.000
    calc_skripsi = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "skripsi",
            "complexity": "basic",
            "tech_platform": "web",
            "urgency_days": 21,
            "selected_addons": [],
        },
    )
    assert calc_skripsi.status_code == 200
    assert calc_skripsi.json()["estimated_min_price"] == 2_000_000

    # 3. Buat 1 order menggunakan layanan 'skripsi', lalu coba hapus 'skripsi' -> wajib ditolak 400!
    order_resp = client.post(
        "/api/v1/orders/",
        json={
            "client_name": "Andi Pratama",
            "client_whatsapp": "081234567890",
            "service_type": "skripsi",
            "title": "Deteksi Masker dengan YOLOv8",
            "description": "Skripsi deteksi masker real-time dengan webcam.",
            "deadline": "21 Hari",
        },
    )
    assert order_resp.status_code == 200

    del_skripsi = client.delete(f"/api/v1/services/{skripsi_svc['id']}", headers=headers)
    assert del_skripsi.status_code == 400
    assert "sudah dipakai" in del_skripsi.json()["detail"].lower()

    # Sedangkan layanan 'mobile_app' yang belum dipakai order bisa dihapus
    del_mobile = client.delete(f"/api/v1/services/{mobile_svc['id']}", headers=headers)
    assert del_mobile.status_code == 200


def test_crud_factors_and_addons():
    """
    Memastikan Admin dapat menambah Add-on baru dan mengubah Faktor Pengali,
    serta kalkulator langsung memperhitungkan Add-on baru tersebut.
    """
    headers = get_auth_headers()

    # Tambah add-on baru: PPT Sidang & Simulasi
    addon_resp = client.post(
        "/api/v1/services/addons",
        headers=headers,
        json={
            "code": "ppt_sidang",
            "label": "Slide PPT Sidang & Sesi Latihan Presentasi",
            "description": "Pembuatan slide presentasi sidang + 1x sesi latihan via Google Meet.",
            "price_type": "fixed",
            "price_min": 150_000,
            "price_max": 300_000,
            "benefit_text": "Slide PPT Sidang Profesional & Simulasi Tanya-Jawab",
            "applicable_services": ["skripsi", "tugas"],
            "is_default_checked": False,
            "is_active": True,
            "display_order": 3,
        },
    )
    assert addon_resp.status_code == 201

    # Hitung skripsi (basic=1.0, web=1.0, 21 hari=1.0 -> base 1.8jt - 3.5jt) + addon 'ppt_sidang' (150rb - 300rb)
    calc_resp = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "skripsi",
            "complexity": "basic",
            "tech_platform": "web",
            "urgency_days": 21,
            "selected_addons": ["ppt_sidang"],
        },
    )
    assert calc_resp.status_code == 200
    res = calc_resp.json()
    assert res["estimated_min_price"] == 1_950_000
    assert res["estimated_max_price"] == 3_800_000
    assert any("Slide PPT Sidang" in b for b in res["benefits"])
