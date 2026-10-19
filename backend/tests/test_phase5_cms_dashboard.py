from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _get_headers(email: str, password: str = "Admin123!") -> dict:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_public_cms_and_superadmin_settings_update():
    """
    Menguji Modul M2.A:
    1. Endpoint publik /cms/public mengembalikan seed awal settings, 4 FAQ, dan 9 Tech Stack.
    2. Role 'admin' biasa ditolak (403) saat mencoba mengubah site_settings.
    3. Role 'superadmin' berhasil mengubah site_settings & nomor WA otomatis dinormalisasi (08xx -> 628xx).
    """
    pub = client.get("/api/v1/cms/public")
    assert pub.status_code == 200
    data = pub.json()
    assert data["settings"]["brand_name"] == "Rizofara Technology"
    assert len(data["faqs"]) >= 4
    assert len(data["tech_stacks"]) >= 9

    ops_headers = _get_headers("ops@rizofara.com")
    super_headers = _get_headers("admin@rizofara.com")

    # Admin biasa ditolak (403)
    forbidden_res = client.put(
        "/api/v1/cms/settings",
        headers=ops_headers,
        json={"settings": {"brand_name": "Hacked Brand"}},
    )
    assert forbidden_res.status_code == 403

    # Superadmin berhasil update & nomor WA 08xx dinormalisasi ke 628xx
    ok_res = client.put(
        "/api/v1/cms/settings",
        headers=super_headers,
        json={
            "settings": {
                "whatsapp_number": "0856-9239-0483",
                "tagline": "Solusi IT & Skripsi Terpercaya",
            }
        },
    )
    assert ok_res.status_code == 200
    updated = ok_res.json()
    assert updated["whatsapp_number"] == "6285692390483"
    assert updated["tagline"] == "Solusi IT & Skripsi Terpercaya"

    # Kembalikan tagline semula
    client.put(
        "/api/v1/cms/settings",
        headers=super_headers,
        json={"settings": {"tagline": "Digital Roots for a Brighter Tomorrow"}},
    )


def test_crud_faqs_tech_stacks_and_dashboard_summary():
    """
    Menguji Modul M11 (CRUD FAQ & Tech Stack) dan Modul M12 (Ringkasan Statistik Dashboard & Keuangan).
    """
    headers = _get_headers("admin@rizofara.com")

    # 1. Buat FAQ baru
    faq_res = client.post(
        "/api/v1/cms/faqs",
        headers=headers,
        json={
            "question": "Apakah menerima pembuatan aplikasi Flutter Android?",
            "answer": "Ya, kami melayani pembuatan aplikasi mobile Android/iOS berbasis Flutter.",
            "category": "umum",
            "is_published": True,
            "display_order": 5,
        },
    )
    assert faq_res.status_code == 200
    faq_id = faq_res.json()["id"]

    # 2. Buat Tech Stack baru
    tech_res = client.post(
        "/api/v1/cms/tech-stacks",
        headers=headers,
        json={
            "name": "Flutter",
            "emoji": "FLT",
            "color": "text-teal-400",
            "is_highlighted": True,
            "is_published": True,
            "display_order": 10,
        },
    )
    assert tech_res.status_code == 200
    tech_id = tech_res.json()["id"]

    # Pastikan keduanya muncul di /cms/public
    pub = client.get("/api/v1/cms/public").json()
    assert any(f["id"] == faq_id for f in pub["faqs"])
    assert any(t["id"] == tech_id for t in pub["tech_stacks"])

    # Hapus FAQ & Tech Stack uji coba
    client.delete(f"/api/v1/cms/faqs/{faq_id}", headers=headers)
    client.delete(f"/api/v1/cms/tech-stacks/{tech_id}", headers=headers)

    # 3. Buat 1 order + pembayaran DP untuk menguji akurasi statistik Dashboard (Modul M12)
    ord_res = client.post(
        "/api/v1/orders/",
        json={
            "client_name": "Budi Santoso",
            "client_whatsapp": "081234567890",
            "service_type": "website",
            "title": "Website Company Profile PT Maju",
            "description": "Landing page + CMS",
            "deadline": "14 Hari",
        },
    )
    assert ord_res.status_code == 200
    ord_id = ord_res.json()["id"]

    client.patch(
        f"/api/v1/orders/{ord_id}/status",
        headers=headers,
        json={"status": "confirmed", "final_price": 2_000_000},
    )
    client.post(
        f"/api/v1/orders/{ord_id}/payments",
        headers=headers,
        json={
            "payment_type": "dp",
            "amount": 800_000,
            "payment_method": "BCA",
            "status": "verified",
        },
    )

    dash_res = client.get("/api/v1/cms/dashboard-summary", headers=headers)
    assert dash_res.status_code == 200
    summary = dash_res.json()
    assert summary["total_orders"] == 1
    assert summary["active_orders"] == 1
    assert summary["total_verified_revenue"] == 800_000
    assert summary["total_outstanding_receivables"] == 1_200_000
    assert summary["orders_by_service"]["website"] == 1
