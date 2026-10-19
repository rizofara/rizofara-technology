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


def test_order_milestones_and_timeline_automation():
    """
    Menguji Modul M5 & M6:
    1. Saat order dibuat, otomatis terbentuk 4 milestone (15%, 25%, 40%, 20%),
       1 log timeline awal, dan pricing_snapshot.
    2. Saat Admin mencentang milestone 1 (15%) dan milestone 2 (25%),
       persentase progres otomatis naik menjadi 40% dan tercatat di timeline!
    """
    headers = get_auth_headers()

    create_resp = client.post(
        "/api/v1/orders/",
        json={
            "client_name": "Rizky Aditya",
            "client_whatsapp": "0856-9239-0483",
            "service_type": "skripsi",
            "title": "Klasifikasi Penyakit Daun Padi dengan CNN",
            "description": "Aplikasi web Flask/FastAPI + model CNN PyTorch.",
            "deadline": "14 Hari",
        },
    )
    assert create_resp.status_code == 200
    order = create_resp.json()
    order_id = order["id"]

    assert order["pricing_snapshot"] is not None
    assert len(order["milestones"]) == 4
    assert len(order["timeline_logs"]) == 1

    m1_id = order["milestones"][0]["id"]
    m2_id = order["milestones"][1]["id"]

    # Centang milestone 1 (bobot 15%)
    r1 = client.patch(
        f"/api/v1/orders/{order_id}/milestones/{m1_id}",
        headers=headers,
        json={"is_completed": True},
    )
    assert r1.status_code == 200
    assert r1.json()["progress_percent"] == 15
    assert r1.json()["status"] == "in_progress"

    # Centang milestone 2 (bobot 25%) -> total progres wajib 15 + 25 = 40%
    r2 = client.patch(
        f"/api/v1/orders/{order_id}/milestones/{m2_id}",
        headers=headers,
        json={"is_completed": True},
    )
    assert r2.status_code == 200
    assert r2.json()["progress_percent"] == 40
    assert len(r2.json()["timeline_logs"]) >= 3


def test_order_payments_and_revision_cycle():
    """
    Menguji Modul M7 (Revisi) & M8 (Pembayaran & Sisa Tagihan) sesuai contoh di PRD §M8:
    - Harga Deal (`final_price`) = Rp 3.000.000, Diskon = Rp 100.000 -> Tagihan Rp 2.900.000
    - DP masuk (`verified`) = Rp 1.200.000 -> Sisa Rp 1.700.000 (`payment_status = partial`)
    - Klien ajukan revisi -> Admin balas revisi + tandai `is_out_of_scope=True`, `extra_cost=250.000`
      -> Total Tagihan menjadi Rp 3.150.000 dan Sisa Tagihan menjadi Rp 1.950.000!
    - Pelunasan Rp 1.950.000 -> Sisa Tagihan = 0 (`payment_status = paid`).
    """
    headers = get_auth_headers()

    create_resp = client.post(
        "/api/v1/orders/",
        json={
            "client_name": "Siti Rahma",
            "client_whatsapp": "0812-9988-7766",
            "service_type": "website",
            "title": "Sistem E-Commerce Toko Batik",
            "description": "Website katalog dan checkout terintegrasi WhatsApp.",
            "deadline": "14 Hari",
        },
    )
    assert create_resp.status_code == 200
    order = create_resp.json()
    order_id = order["id"]
    order_code = order["order_code"]

    # 1. Admin menetapkan Harga Deal Rp 3.000.000 dan Diskon Rp 100.000
    status_resp = client.patch(
        f"/api/v1/orders/{order_id}/status",
        headers=headers,
        json={
            "final_price": 3_000_000,
            "discount_amount": 100_000,
            "status": "confirmed",
            "timeline_message": "Harga deal disepakati Rp 2.900.000 setelah diskon.",
        },
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["effective_bill"] == 2_900_000
    assert status_resp.json()["remaining_balance"] == 2_900_000
    assert status_resp.json()["payment_status"] == "unpaid"

    # 2. Catat pembayaran DP sebesar Rp 1.200.000
    pay_dp = client.post(
        f"/api/v1/orders/{order_id}/payments",
        headers=headers,
        json={
            "payment_type": "dp",
            "amount": 1_200_000,
            "method": "transfer_bank",
            "reference_note": "BCA a.n. Siti Rahma",
            "status": "verified",
        },
    )
    assert pay_dp.status_code == 201
    dp_data = pay_dp.json()
    assert dp_data["total_paid"] == 1_200_000
    assert dp_data["remaining_balance"] == 1_700_000
    assert dp_data["payment_status"] == "partial"
    assert dp_data["status"] == "dp_received"

    # 3. Klien mengajukan revisi
    rev_resp = client.post(
        f"/api/v1/orders/{order_code}/revision",
        json={
            "notes": "Tolong tambahkan fitur laporan ekspor Excel dan modul stok gudang.",
            "wa_last4": "7766",
        },
    )
    assert rev_resp.status_code == 200
    rev_id = rev_resp.json()["id"]

    # 4. Admin membalas revisi, menandai out-of-scope dengan tambahan Rp 250.000, dan menyelesaikan revisi
    rev_admin = client.patch(
        f"/api/v1/orders/{order_id}/revisions/{rev_id}",
        headers=headers,
        json={
            "status": "completed",
            "admin_response": "Fitur ekspor Excel & stok gudang sudah ditambahkan dan siap diuji di link demo.",
            "is_out_of_scope": True,
            "extra_cost": 250_000,
        },
    )
    assert rev_admin.status_code == 200
    updated_order = rev_admin.json()
    assert updated_order["effective_bill"] == 3_150_000
    assert updated_order["remaining_balance"] == 1_950_000
    assert updated_order["status"] == "review"

    # 5. Cek dari sisi Klien (Tracking Endpoint)
    track_resp = client.get(f"/api/v1/orders/track/{order_code}?wa_last4=7766")
    assert track_resp.status_code == 200
    tracked = track_resp.json()[0]
    assert tracked["effective_bill"] == 3_150_000
    assert tracked["total_paid"] == 1_200_000
    assert tracked["remaining_balance"] == 1_950_000
    assert tracked["revisions"][0]["admin_response"] is not None

    # 6. Catat Pelunasan sebesar Rp 1.950.000 -> Lunas (paid)
    pay_final = client.post(
        f"/api/v1/orders/{order_id}/payments",
        headers=headers,
        json={
            "payment_type": "final",
            "amount": 1_950_000,
            "method": "qris",
            "reference_note": "Pelunasan QRIS",
            "status": "verified",
        },
    )
    assert pay_final.status_code == 201
    final_data = pay_final.json()
    assert final_data["total_paid"] == 3_150_000
    assert final_data["remaining_balance"] == 0
    assert final_data["payment_status"] == "paid"
