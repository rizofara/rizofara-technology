from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _get_admin_headers() -> dict:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@rizofara.com", "password": "Admin123!"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_public_showcase_seed_and_portfolio_crud():
    """
    Memastikan endpoint publik /showcase/public mengembalikan seed awal (4 testimoni, 3 portofolio),
    serta menguji CRUD Portofolio, auto-slug duplikat (-2), dan aturan client_consent.
    """
    pub = client.get("/api/v1/showcase/public")
    assert pub.status_code == 200
    data = pub.json()
    assert len(data["portfolio_items"]) >= 3
    assert len(data["testimonials"]) >= 4
    assert data["rating_summary"]["total_reviews"] >= 4

    headers = _get_admin_headers()

    # 1. Buat portofolio baru tanpa izin klien tapi is_published=True -> Harus ditolak (400)
    bad_res = client.post(
        "/api/v1/showcase/portfolio",
        headers=headers,
        json={
            "title": "Sistem Pakar Rahasia",
            "category": "Skripsi AI & Machine Learning",
            "summary": "Aplikasi sistem pakar diagnosa penyakit.",
            "tech_tags": ["Python", "FastAPI"],
            "client_consent": False,
            "is_published": True,
        },
    )
    assert bad_res.status_code == 400

    # 2. Buat portofolio valid #1
    p1 = client.post(
        "/api/v1/showcase/portfolio",
        headers=headers,
        json={
            "title": "Aplikasi Absensi Geolocation Flutter",
            "category": "Mobile & IoT",
            "badge_color": "sky",
            "summary": "Aplikasi presensi karyawan berbasis titik koordinat GPS dan selfie.",
            "tech_tags": ["Flutter", "Laravel", "MySQL"],
            "highlight_metric": "Radius Akurat 10m",
            "client_consent": True,
            "is_published": True,
        },
    )
    assert p1.status_code == 200
    p1_data = p1.json()
    assert p1_data["slug"] == "aplikasi-absensi-geolocation-flutter"

    # 3. Buat portofolio dengan judul yang sama -> slug otomatis berakhiran -2 (Acceptance Criteria M10)
    p2 = client.post(
        "/api/v1/showcase/portfolio",
        headers=headers,
        json={
            "title": "Aplikasi Absensi Geolocation Flutter",
            "category": "Mobile & IoT",
            "summary": "Versi kedua untuk instansi pendidikan.",
            "tech_tags": ["Flutter", "FastAPI"],
            "client_consent": True,
            "is_published": True,
        },
    )
    assert p2.status_code == 200
    p2_data = p2.json()
    assert p2_data["slug"] == "aplikasi-absensi-geolocation-flutter-2"

    # Bersihkan data test
    client.delete(f"/api/v1/showcase/portfolio/{p1_data['id']}", headers=headers)
    client.delete(f"/api/v1/showcase/portfolio/{p2_data['id']}", headers=headers)


def test_client_testimonial_submission_and_moderation_flow():
    """
    Menguji alur lengkap Modul M9:
    1. Order yang belum 'completed' ditolak saat submit testimoni.
    2. Setelah order diubah menjadi 'completed', klien bisa submit testimoni (status awal 'pending').
    3. Order yang sama tidak bisa mengirim testimoni ke-2 kalinya.
    4. Sebelum di-approve Admin, testimoni belum tampil di publik.
    5. Setelah di-approve Admin, testimoni tampil di publik dengan source='client'.
    """
    headers = _get_admin_headers()

    # Buat order baru
    order_res = client.post(
        "/api/v1/orders/",
        json={
            "client_name": "Nadia Putri",
            "client_whatsapp": "081299997788",
            "service_type": "skripsi",
            "title": "Skripsi Deteksi Masker YOLOv8",
            "description": "Deteksi masker real-time webcam",
            "deadline": "21 Hari",
        },
    )
    assert order_res.status_code == 200
    order = order_res.json()
    order_id = order["id"]
    order_code = order["order_code"]

    # 1. Coba submit testimoni saat order masih pending -> Ditolak 400
    early_submit = client.post(
        "/api/v1/showcase/testimonials/submit",
        json={
            "order_code": order_code,
            "wa_last4": "7788",
            "client_name": "Nadia Putri",
            "client_role": "Mahasiswi Teknik Komputer",
            "comment": "Program YOLOv8 berjalan lancar dan akurasinya tinggi sekali!",
            "rating": 5,
            "consent_publish": True,
        },
    )
    assert early_submit.status_code == 400

    # 2. Admin ubah status order menjadi 'completed'
    upd = client.patch(
        f"/api/v1/orders/{order_id}/status",
        headers=headers,
        json={"status": "completed"},
    )
    assert upd.status_code == 200

    # 3. Klien submit testimoni dengan WA salah -> Ditolak 403
    wrong_wa = client.post(
        "/api/v1/showcase/testimonials/submit",
        json={
            "order_code": order_code,
            "wa_last4": "0000",
            "client_name": "Nadia Putri",
            "client_role": "Mahasiswi Teknik Komputer",
            "comment": "Program YOLOv8 berjalan lancar dan akurasinya tinggi sekali!",
            "rating": 5,
            "consent_publish": True,
        },
    )
    assert wrong_wa.status_code == 403

    # 4. Klien submit testimoni dengan WA benar -> Berhasil (status='pending')
    ok_submit = client.post(
        "/api/v1/showcase/testimonials/submit",
        json={
            "order_code": order_code,
            "wa_last4": "7788",
            "client_name": "Nadia Putri",
            "client_role": "Mahasiswi Teknik Komputer",
            "tag": "Lulus Sidang Sempurna",
            "comment": "Program YOLOv8 berjalan lancar dan akurasinya tinggi sekali!",
            "rating": 5,
            "consent_publish": True,
        },
    )
    assert ok_submit.status_code == 200
    t_data = ok_submit.json()
    assert t_data["status"] == "pending"
    assert t_data["source"] == "client"
    assert t_data["order_code"] == order_code

    # 5. Coba submit ke-2 kalinya untuk order yang sama -> Ditolak 400
    dup_submit = client.post(
        "/api/v1/showcase/testimonials/submit",
        json={
            "order_code": order_code,
            "wa_last4": "7788",
            "client_name": "Nadia Putri",
            "client_role": "Mahasiswi Teknik Komputer",
            "comment": "Submit ulang testimoni.",
            "rating": 5,
            "consent_publish": True,
        },
    )
    assert dup_submit.status_code == 400

    # 6. Pastikan belum muncul di endpoint publik sebelum di-approve
    pub_before = client.get("/api/v1/showcase/public").json()
    assert not any(t["id"] == t_data["id"] for t in pub_before["testimonials"])

    # 7. Admin approve testimoni
    mod_res = client.patch(
        f"/api/v1/showcase/testimonials/{t_data['id']}",
        headers=headers,
        json={"status": "approved"},
    )
    assert mod_res.status_code == 200
    assert mod_res.json()["status"] == "approved"

    # 8. Sekarang harus muncul di endpoint publik
    pub_after = client.get("/api/v1/showcase/public").json()
    assert any(t["id"] == t_data["id"] for t in pub_after["testimonials"])
    assert pub_after["rating_summary"]["verified_count"] >= 1

    # Bersihkan testimoni test
    client.delete(f"/api/v1/showcase/testimonials/{t_data['id']}", headers=headers)
