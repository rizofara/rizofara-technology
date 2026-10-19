from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from app.db.session import Base


class Testimonial(Base):
    """
    Tabel Testimoni Klien (Modul M9).
    Mendukung input manual oleh Admin maupun pengiriman langsung oleh Klien
    yang ordernya telah berstatus 'completed' (dengan moderasi status='pending').
    """
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String(100), nullable=False)
    client_role = Column(String(100), nullable=False)
    project_label = Column(String(150), nullable=True)
    tag = Column(String(50), nullable=True, default="Klien Terverifikasi")
    comment = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False, default=5)
    avatar_initials = Column(String(10), nullable=True)
    avatar_color = Column(String(80), nullable=False, default="from-teal-500 to-emerald-600")
    order_code = Column(String(30), nullable=True, unique=True, index=True)
    source = Column(String(20), nullable=False, default="admin")  # 'admin' | 'client'
    status = Column(String(20), nullable=False, default="approved")  # 'pending' | 'approved' | 'rejected'
    is_featured = Column(Boolean, nullable=False, default=True)
    consent_publish = Column(Boolean, nullable=False, default=True)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PortfolioItem(Base):
    """
    Tabel Portofolio & Studi Kasus (Modul M10).
    Menyimpan showcase project nyata beserta teknologi (tech_tags), metrik keberhasilan,
    dan persetujuan kerahasiaan klien (client_consent).
    """
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    category = Column(String(80), nullable=False)
    badge_color = Column(String(30), nullable=False, default="teal")  # teal, indigo, emerald, amber, rose, sky
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    tech_tags = Column(JSON, nullable=False, default=list)
    highlight_metric = Column(String(100), nullable=True)
    thumbnail_url = Column(String(255), nullable=True)
    demo_url = Column(String(255), nullable=True)
    repo_url = Column(String(255), nullable=True)
    client_consent = Column(Boolean, nullable=False, default=True)
    is_published = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=True)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
