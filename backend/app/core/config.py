import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Rizofara Technology"
    ORDER_CODE_PREFIX: str = "RZ"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = "rizofara-dev-secret-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 jam kerja
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/app.db"
    
    # Storage Directories (Dipisahkan antara Privat & Publik untuk keamanan S-03)
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    PRIVATE_ORDERS_DIR: str = str(BASE_DIR / "storage" / "private" / "orders")
    PRIVATE_PAYMENTS_DIR: str = str(BASE_DIR / "storage" / "private" / "payments")
    PUBLIC_MEDIA_DIR: str = str(BASE_DIR / "storage" / "public" / "media")
    UPLOAD_DIR: str = str(BASE_DIR / "storage" / "private" / "orders")  # Kompatibilitas lama
    
    # Batas Ukuran Upload File (dalam Bytes)
    MAX_DOC_UPLOAD_SIZE: int = 20 * 1024 * 1024   # 20 MB untuk berkas tugas/skripsi
    MAX_IMAGE_UPLOAD_SIZE: int = 3 * 1024 * 1024  # 3 MB untuk gambar portofolio/profil
    
    # WhatsApp Admin / Business Contact
    WHATSAPP_ADMIN_NUMBER: str = "6285692390483"  # Nomor WhatsApp Bisnis
    
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

# Pastikan seluruh direktori penyimpanan tersedia
for directory in [
    settings.PRIVATE_ORDERS_DIR,
    settings.PRIVATE_PAYMENTS_DIR,
    settings.PUBLIC_MEDIA_DIR,
]:
    os.makedirs(directory, exist_ok=True)

