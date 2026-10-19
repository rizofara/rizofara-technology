from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _login(email: str, password: str) -> str:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


def test_security_headers_and_seo_endpoints():
    """
    Pengujian Fase 6.1:
    - Setiap response wajib menyertakan HTTP Security Headers:
      X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection.
    - Endpoint /robots.txt dan /sitemap.xml tersedia secara publik dan valid.
    """
    res_robots = client.get("/robots.txt")
    assert res_robots.status_code == 200
    assert "Disallow: /api/" in res_robots.text
    assert "Sitemap:" in res_robots.text
    assert res_robots.headers.get("X-Content-Type-Options") == "nosniff"
    assert res_robots.headers.get("X-Frame-Options") == "DENY"
    assert res_robots.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    # Trigger seed showcase terlebih dahulu agar sitemap memuat portofolio publik
    client.get("/api/v1/showcase/public")

    res_sitemap = client.get("/sitemap.xml")
    assert res_sitemap.status_code == 200
    assert "<urlset" in res_sitemap.text
    assert "deteksi-penyakit-daun-cnn" in res_sitemap.text


def test_login_rate_limiting_protection():
    """
    Pengujian Fase 6.2:
    - Endpoint POST /api/v1/auth/login dibatasi maksimal 10 request per 60 detik per IP.
    - Request ke-11 harus dikembalikan dengan HTTP 429 Too Many Requests beserta header Retry-After.
    """
    for _ in range(10):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@rizofara.com", "password": "WrongPassword123!"},
        )
        assert r.status_code == 401

    r_blocked = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@rizofara.com", "password": "WrongPassword123!"},
    )
    assert r_blocked.status_code == 429
    assert "Retry-After" in r_blocked.headers
    assert "Terlalu banyak permintaan" in r_blocked.json()["detail"]


def test_database_hot_backup_and_rbac():
    """
    Pengujian Fase 6.3:
    - Role 'admin' biasa ditolak (403 Forbidden) saat mencoba membuat atau melihat daftar backup database.
    - Role 'superadmin' berhasil membuat snapshot backup SQLite baru dan membaca daftarnya.
    """
    ops_token = _login("ops@rizofara.com", "Admin123!")
    ops_headers = {"Authorization": f"Bearer {ops_token}"}

    res_forbidden = client.post("/api/v1/cms/backups", headers=ops_headers)
    assert res_forbidden.status_code == 403

    super_token = _login("admin@rizofara.com", "Admin123!")
    super_headers = {"Authorization": f"Bearer {super_token}"}

    res_create = client.post("/api/v1/cms/backups", headers=super_headers)
    assert res_create.status_code == 200
    data = res_create.json()
    assert data["filename"].startswith("rizofara_backup_")
    assert data["filename"].endswith(".sqlite3")
    assert data["size_bytes"] > 0

    res_list = client.get("/api/v1/cms/backups", headers=super_headers)
    assert res_list.status_code == 200
    backups = res_list.json()
    assert len(backups) >= 1
    assert any(b["filename"] == data["filename"] for b in backups)
