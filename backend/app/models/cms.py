from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.db.session import Base


class SiteSetting(Base):
    """
    Tabel Konfigurasi Key-Value Profil Bisnis & Website (`site_settings` - Modul M2.A).
    Memungkinkan Superadmin mengubah nama brand, nomor WhatsApp utama, teks Hero,
    dan info rekening pembayaran tanpa mengubah kode.
    """
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False, default="")
    group = Column(String(40), nullable=False, default="general")
    description = Column(String(200), nullable=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class FaqItem(Base):
    """
    Tabel Pertanyaan Sering Diajukan (`faqs` - Modul M11).
    """
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(255), nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(40), nullable=False, default="umum")  # umum, pembayaran, revisi, privasi
    is_published = Column(Boolean, nullable=False, default=True)
    display_order = Column(Integer, nullable=False, default=0)


class TechStackItem(Base):
    """
    Tabel Bahasa Pemrograman & Tools (`tech_stacks` - Modul M11).
    """
    __tablename__ = "tech_stacks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(60), nullable=False)
    emoji = Column(String(20), nullable=False, default="💻")
    color = Column(String(40), nullable=False, default="text-teal-400")
    is_highlighted = Column(Boolean, nullable=False, default=False)
    is_published = Column(Boolean, nullable=False, default=True)
    display_order = Column(Integer, nullable=False, default=0)
