import io
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)



def test_calculator_prd_cases():
    """Menguji rumus Pricing Engine sesuai tabel uji PRD §14.1."""
    # Kasus 1: Skripsi, Intermediate, Web, 14 hari, +Report
    res1 = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "skripsi",
            "complexity": "intermediate",
            "tech_platform": "web",
            "urgency_days": 14,
            "include_report": True,
            "include_wireframe": False,
        },
    )
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["estimated_min_price"] == 2_750_000
    assert d1["estimated_max_price"] == 5_400_000
    assert d1["recommended_dp"] == 1_100_000
    assert d1["urgency_tier"] == "Standar"
    assert d1["is_feasible"] is True

    # Kasus 2: Skripsi, Basic, Web, 21 hari, tanpa add-on
    res2 = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "skripsi",
            "complexity": "basic",
            "tech_platform": "web",
            "urgency_days": 21,
            "include_report": False,
            "include_wireframe": False,
        },
    )
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["estimated_min_price"] == 1_800_000
    assert d2["estimated_max_price"] == 3_500_000
    assert d2["recommended_dp"] == 700_000
    assert d2["urgency_tier"] == "Santai"

    # Kasus 3: Tugas Kuliah 3 hari (Perbaikan B-06: tidak ditolak oleh batas 5 hari)
    res3 = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "tugas",
            "complexity": "basic",
            "tech_platform": "web",
            "urgency_days": 3,
            "include_report": False,
            "include_wireframe": False,
        },
    )
    assert res3.status_code == 200
    d3 = res3.json()
    assert d3["estimated_min_price"] == 100_000
    assert d3["estimated_max_price"] == 350_000
    assert d3["recommended_dp"] == 50_000
    assert d3["is_feasible"] is True

    # Kasus 4: Skripsi 3 hari -> is_feasible harus False (di bawah min_days=5)
    res4 = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "skripsi",
            "complexity": "basic",
            "tech_platform": "web",
            "urgency_days": 3,
            "include_report": False,
            "include_wireframe": False,
        },
    )
    assert res4.status_code == 200
    assert res4.json()["is_feasible"] is False

    # Kasus 5 (Perbaikan B-04): Website dengan include_report=True tidak boleh menampilkan benefit laporan akademik
    res5 = client.post(
        "/api/v1/calculator/estimate",
        json={
            "service_type": "website",
            "complexity": "basic",
            "tech_platform": "web",
            "urgency_days": 14,
            "include_report": True,
            "include_wireframe": False,
        },
    )
    assert res5.status_code == 200
    benefits_str = " ".join(res5.json()["benefits"])
    assert "Laporan" not in benefits_str


def test_order_creation_and_security():
    """
    Menguji pembuatan order (kalkulasi harga server B-02, kode RZ- B-11),
    pelacakan order aman (S-02), dan validasi upload file (S-03 & S-04).
    """
    # 1. Buat order dengan percobaan manipulasi price_estimate = 1 Rupiah
    create_res = client.post(
        "/api/v1/orders/",
        json={
            "client_name": "Budi Santoso",
            "client_whatsapp": "0856-9239-0483",
            "client_email": "budi@example.com",
            "campus_or_company": "Universitas Indonesia",
            "service_type": "skripsi",
            "complexity": "intermediate",
            "tech_platform": "web",
            "urgency_days": 14,
            "include_report": True,
            "include_wireframe": False,
            "tech_stack": "FastAPI + React",
            "title": "Sistem Deteksi Penyakit Daun dengan CNN",
            "description": "Klasifikasi citra daun menggunakan ResNet50",
            "deadline": "14 Hari",
            "price_estimate": 1,  # Manipulasi harga dari client!
        },
    )
    assert create_res.status_code == 200
    order = create_res.json()

    # Pastikan kode order memakai prefix RZ- dan harga dihitung ulang oleh server (2.750.000, bukan 1!)
    assert order["order_code"].startswith("RZ-")
    assert order["price_estimate"] == 2_750_000
    assert order["client_whatsapp"] == "6285692390483"

    order_id = order["id"]
    order_code = order["order_code"]

    # 2. Uji Celah Keamanan Tracking S-02: pencarian pendek '08' atau 'RZ' WAJIB ditolak (404)
    leak_res1 = client.get("/api/v1/orders/track/08")
    assert leak_res1.status_code == 404

    leak_res2 = client.get("/api/v1/orders/track/RZ")
    assert leak_res2.status_code == 404

    # 3. Uji Tracking dengan Kode Order benar tetapi 4 digit WA salah -> WAJIB ditolak (404)
    wrong_pin_res = client.get(f"/api/v1/orders/track/{order_code}?wa_last4=9999")
    assert wrong_pin_res.status_code == 404

    # 4. Uji Tracking dengan Kode Order benar + 4 digit WA benar -> Berhasil & nama disamarkan
    valid_track_res = client.get(f"/api/v1/orders/track/{order_code}?wa_last4=0483")
    assert valid_track_res.status_code == 200
    tracked_list = valid_track_res.json()
    assert len(tracked_list) == 1
    assert tracked_list[0]["order_code"] == order_code
    assert tracked_list[0]["client_name"] == "Budi S***"

    # 5. Uji Validasi Upload File (S-04): tolak file .exe berbahaya
    bad_file = ("virus.exe", io.BytesIO(b"MZ-fake-executable"), "application/octet-stream")
    bad_upload = client.post(
        f"/api/v1/orders/{order_id}/upload-file",
        files={"file": bad_file},
    )
    assert bad_upload.status_code == 400

    # 6. Uji Upload File PDF yang sah -> Berhasil
    good_file = ("panduan_skripsi.pdf", io.BytesIO(b"%PDF-1.4 contoh isi panduan"), "application/pdf")
    good_upload = client.post(
        f"/api/v1/orders/{order_id}/upload-file",
        files={"file": good_file},
    )
    assert good_upload.status_code == 200
    assert good_upload.json()["file_name"] == "panduan_skripsi.pdf"

    # Bersihkan file hasil test dari disk
    from app.core.config import settings
    for fname in os.listdir(settings.PRIVATE_ORDERS_DIR):
        if fname.startswith(order_code):
            os.remove(os.path.join(settings.PRIVATE_ORDERS_DIR, fname))


def test_whatsapp_branding():
    """Memastikan generator link WhatsApp menggunakan nama brand Rizofara Technology (Perbaikan B-11)."""
    res = client.post(
        "/api/v1/contact/whatsapp-link",
        json={
            "name": "Andi",
            "service_type": "Skripsi",
            "topic": "SPK Metode AHP",
        },
    )
    assert res.status_code == 200
    assert "Rizofara Technology" in res.json()["message_text"]
    assert "Tech Solution" not in res.json()["message_text"]
