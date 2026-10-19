import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, JSON
from app.db.session import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class ServiceCatalog(Base):
    """
    Model tabel `services` untuk menyimpan katalog layanan secara dinamis
    beserta rentang harga dasar dan durasi pengerjaan (Modul M3.A).
    """
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    short_label = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    features = Column(JSON, nullable=False, default=list)
    icon = Column(String(50), nullable=False, default="Code2")
    color = Column(String(30), nullable=False, default="teal")
    category = Column(String(30), nullable=False, default="akademik")  # akademik | bisnis

    base_price_min = Column(Integer, nullable=False)
    base_price_max = Column(Integer, nullable=False)
    standard_days = Column(Integer, nullable=False, default=14)
    min_days = Column(Integer, nullable=False, default=3)
    max_days = Column(Integer, nullable=False, default=60)

    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class PricingFactor(Base):
    """
    Model tabel `pricing_factors` untuk menyimpan faktor pengali kalkulator:
    - `complexity` (misal: basic=1.0, intermediate=1.3, advanced=1.7, expert=2.2)
    - `platform` (misal: web=1.0, mobile=1.35, ai_ml=1.45, iot=1.4, desktop=1.15)
    (Modul M3.B)
    """
    __tablename__ = "pricing_factors"

    id = Column(Integer, primary_key=True, index=True)
    factor_type = Column(String(30), index=True, nullable=False)  # complexity | platform
    code = Column(String(40), index=True, nullable=False)
    label = Column(String(80), nullable=False)
    description = Column(String(255), nullable=True)
    multiplier = Column(Float, nullable=False, default=1.0)
    applicable_services = Column(JSON, nullable=True)  # null = berlaku untuk semua layanan

    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class PricingAddon(Base):
    """
    Model tabel `pricing_addons` untuk menyimpan fasilitas tambahan (Add-ons)
    pada kalkulator harga, baik bertipe nominal tetap (`fixed`) maupun persentase (`percent`)
    (Modul M3.D).
    """
    __tablename__ = "pricing_addons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(40), unique=True, index=True, nullable=False)
    label = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    price_type = Column(String(20), nullable=False, default="fixed")  # fixed | percent
    price_min = Column(Integer, nullable=False, default=0)
    price_max = Column(Integer, nullable=False, default=0)
    benefit_text = Column(String(255), nullable=False)
    applicable_services = Column(JSON, nullable=True)  # null = semua layanan, atau list slug ["skripsi", "tugas"]

    is_default_checked = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
