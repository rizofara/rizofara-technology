from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)


def test_admin_endpoints_reject_unauthenticated_requests():
    """Memastikan Celah S-01 sudah tertutup: endpoint admin wajib menolak akses tanpa token (401)."""
    assert client.get("/api/v1/orders/").status_code == 401
    assert client.get("/api/v1/orders/1").status_code == 401
    assert client.patch("/api/v1/orders/1/status", json={"status": "completed"}).status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_login_and_crud_admin_profile():
    """Menguji alur Login JWT, baca profil (/me), CRUD update profil, dan ganti password."""
    # 1. Login dengan password salah -> 401
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@rizofara.com", "password": "SalahPassword123"},
    )
    assert bad_login.status_code == 401

    # 2. Login dengan kredensial Superadmin yang benar -> 200 + JWT Token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@rizofara.com", "password": "Admin123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    assert token_data["admin"]["email"] == "admin@rizofara.com"
    assert token_data["admin"]["role"] == "superadmin"

    # 3. Akses endpoint admin /orders/ dengan token JWT -> 200 OK
    orders_res = client.get("/api/v1/orders/", headers=headers)
    assert orders_res.status_code == 200

    # 4. CRUD Update Profil Admin sendiri (PATCH /api/v1/auth/me)
    update_res = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={
            "name": "Sofia Azzahra",
            "title": "Co-Founder & Lead Engineer",
            "bio": "Spesialis AI, FastAPI, dan Full-Stack Web Development.",
            "whatsapp": "6285692390483",
        },
    )
    assert update_res.status_code == 200
    updated_profile = update_res.json()
    assert updated_profile["name"] == "Sofia Azzahra"
    assert updated_profile["title"] == "Co-Founder & Lead Engineer"

    # 5. Ganti Password dengan password lama salah -> 400
    bad_pw = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={
            "current_password": "Salah",
            "new_password": "PasswordBaru123!",
            "confirm_password": "PasswordBaru123!",
        },
    )
    assert bad_pw.status_code == 400

    # 6. Ganti Password dengan password lama benar -> 200
    good_pw = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={
            "current_password": "Admin123!",
            "new_password": "PasswordBaru123!",
            "confirm_password": "PasswordBaru123!",
        },
    )
    assert good_pw.status_code == 200

    # 7. Login ulang dengan password baru -> 200
    relogin = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@rizofara.com", "password": "PasswordBaru123!"},
    )
    assert relogin.status_code == 200
    new_token_headers = {"Authorization": f"Bearer {relogin.json()['access_token']}"}

    # 8. Kembalikan password Superadmin ke default Admin123! agar tes berikutnya selalu idempotent
    restore_pw = client.post(
        "/api/v1/auth/change-password",
        headers=new_token_headers,
        json={
            "current_password": "PasswordBaru123!",
            "new_password": "Admin123!",
            "confirm_password": "Admin123!",
        },
    )
    assert restore_pw.status_code == 200


def test_rbac_superadmin_vs_admin():
    """Menguji Role-Based Access Control (RBAC): hanya Superadmin yang boleh menambah/menghapus admin."""
    # Login sebagai Admin biasa (ops@rizofara.com)
    ops_login = client.post(
        "/api/v1/auth/login",
        json={"email": "ops@rizofara.com", "password": "Admin123!"},
    )
    assert ops_login.status_code == 200
    ops_headers = {"Authorization": f"Bearer {ops_login.json()['access_token']}"}

    # Admin biasa mencoba menambah user baru -> WAJIB ditolak 403 Forbidden
    forbidden_res = client.post(
        "/api/v1/auth/users",
        headers=ops_headers,
        json={
            "name": "Admin Baru",
            "email": f"baru_{uuid.uuid4().hex[:6]}@rizofara.com",
            "password": "Password123!",
            "role": "admin",
        },
    )
    assert forbidden_res.status_code == 403

    # Login sebagai Superadmin (admin@rizofara.com)
    sa_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@rizofara.com", "password": "Admin123!"},
    )
    assert sa_login.status_code == 200
    sa_id = sa_login.json()["admin"]["id"]
    sa_headers = {"Authorization": f"Bearer {sa_login.json()['access_token']}"}

    # Superadmin menambah user baru dengan unique email -> Berhasil 201 Created
    unique_email = f"dev_{uuid.uuid4().hex[:6]}@rizofara.com"
    create_res = client.post(
        "/api/v1/auth/users",
        headers=sa_headers,
        json={
            "name": "Developer Junior",
            "email": unique_email,
            "password": "Password123!",
            "role": "admin",
            "title": "Junior Backend Developer",
        },
    )
    assert create_res.status_code == 201
    new_user_id = create_res.json()["id"]

    # Superadmin mencoba menghapus dirinya sendiri -> WAJIB ditolak 400
    self_del = client.delete(f"/api/v1/auth/users/{sa_id}", headers=sa_headers)
    assert self_del.status_code == 400

    # Superadmin menghapus akun Developer Junior -> Berhasil 200
    del_res = client.delete(f"/api/v1/auth/users/{new_user_id}", headers=sa_headers)
    assert del_res.status_code == 200
