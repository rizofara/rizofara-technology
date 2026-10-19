import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.db.session import Base


def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class AdminUser(Base):
    """
    Model tabel `admin_users` untuk menyimpan akun pengelola website (Co-Founders & Tim Admin).
    Mendukung Role-Based Access Control (superadmin & admin) serta manajemen profil.
    """
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="admin", nullable=False)  # "superadmin" atau "admin"

    # Informasi Profil Admin
    title = Column(String(100), nullable=True)       # Contoh: "Lead Tech & AI"
    bio = Column(Text, nullable=True)                # Deskripsi keahlian / fokus
    whatsapp = Column(String(30), nullable=True)     # Nomor WA admin
    avatar_url = Column(String(500), nullable=True)  # URL foto profil

    # Status & Jejak Waktu
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
