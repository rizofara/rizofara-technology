import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Cek apakah berjalan di lingkungan Vercel Serverless (read-only filesystem kecuali /tmp)
IS_VERCEL = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV") is not None
STORAGE_ROOT = Path("/tmp/storage") if IS_VERCEL else (BASE_DIR / "storage")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Rizofara Technology"
    ORDER_CODE_PREFIX: str = "RZ"
    API_V1_STR: str = "/api/v1"

    # Security & JWT
    SECRET_KEY: str = "rizofara-dev-secret-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 jam kerja

    # Database
    DATABASE_URL: str = (
        "sqlite:////tmp/app.db" if IS_VERCEL else f"sqlite:///{BASE_DIR}/app.db"
    )

    # Storage Directories (Dipisahkan antara Privat & Publik untuk keamanan S-03)
    STORAGE_DIR: str = str(STORAGE_ROOT)
    PRIVATE_ORDERS_DIR: str = str(STORAGE_ROOT / "private" / "orders")
    PRIVATE_PAYMENTS_DIR: str = str(STORAGE_ROOT / "private" / "payments")
    PUBLIC_MEDIA_DIR: str = str(STORAGE_ROOT / "public" / "media")
    UPLOAD_DIR: str = str(STORAGE_ROOT / "private" / "orders")  # Kompatibilitas lama

    # Batas Ukuran Upload File (dalam Bytes)
    MAX_DOC_UPLOAD_SIZE: int = 20 * 1024 * 1024   # 20 MB untuk berkas tugas/skripsi
    MAX_IMAGE_UPLOAD_SIZE: int = 3 * 1024 * 1024  # 3 MB untuk gambar portofolio/profil

    # WhatsApp Admin / Business Contact
    WHATSAPP_ADMIN_NUMBER: str = "6285141396021"  # Nomor WhatsApp Bisnis

    # Telegram Alert (Opsional)
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()

# Pastikan seluruh direktori penyimpanan tersedia tanpa crash di lingkungan serverless
try:
    for directory in [
        settings.PRIVATE_ORDERS_DIR,
        settings.PRIVATE_PAYMENTS_DIR,
        settings.PUBLIC_MEDIA_DIR,
    ]:
        os.makedirs(directory, exist_ok=True)
except Exception as e:
    print(f"Notice: Storage directory initialization skipped/fallback: {e}")
