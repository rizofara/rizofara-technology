import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def utc_now() -> datetime.datetime:
    """Mengembalikan waktu UTC saat ini (menggantikan datetime.utcnow yang deprecated)."""
    return datetime.datetime.now(datetime.timezone.utc)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)

    # Klien Info
    client_name = Column(String(100), nullable=False)
    client_whatsapp = Column(String(30), nullable=False, index=True)
    client_email = Column(String(100), nullable=True)
    campus_or_company = Column(String(100), nullable=True)

    # Detail Project
    service_type = Column(String(50), nullable=False)  # skripsi, tugas, website, chatbot, dll.
    tech_stack = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(String(50), nullable=False)

    # Finansial & Snapshot Harga (Modul M5 & M8)
    price_estimate = Column(Integer, default=0)  # Estimasi min dari kalkulator
    price_estimate_max = Column(Integer, default=0)  # Estimasi max dari kalkulator
    final_price = Column(Integer, default=0)  # Harga deal setelah negosiasi (0 = belum ditetapkan)
    discount_amount = Column(Integer, default=0)  # Potongan harga / diskon
    dp_amount = Column(Integer, default=0)  # Total DP/pembayaran masuk (disinkronkan dengan tabel payments)
    pricing_snapshot = Column(JSON, nullable=True)  # Snapshot konfigurasi harga saat order dibuat

    # Status & Progres (Modul M6)
    status = Column(
        String(30), default="pending"
    )  # pending, confirmed, dp_received, in_progress, review, revision, completed, cancelled
    progress_percent = Column(Integer, default=10)
    source = Column(String(30), default="web")  # web | whatsapp | manual
    cancel_reason = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Deliverables & Links
    demo_url = Column(String(255), nullable=True)
    assigned_to = Column(String(50), nullable=True)  # PIC Co-Founder
    internal_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    files = relationship(
        "OrderFile", back_populates="order", cascade="all, delete-orphan"
    )
    revisions = relationship(
        "Revision",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="Revision.id.desc()",
    )
    milestones = relationship(
        "OrderMilestone",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderMilestone.display_order.asc(), OrderMilestone.id.asc()",
    )
    timeline_logs = relationship(
        "OrderTimelineLog",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderTimelineLog.id.desc()",
    )
    payments = relationship(
        "OrderPayment",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderPayment.id.desc()",
    )


class OrderFile(Base):
    __tablename__ = "order_files"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=utc_now)

    order = relationship("Order", back_populates="files")


class OrderMilestone(Base):
    """
    Model tabel `order_milestones` (Modul M6):
    Menyimpan checklist tahapan pengerjaan proyek beserta bobot persentasenya.
    Saat Admin mencentang milestone, persentase progres order dihitung otomatis.
    """
    __tablename__ = "order_milestones"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    weight_percent = Column(Integer, nullable=False, default=25)
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime, nullable=True)
    display_order = Column(Integer, nullable=False, default=1)

    order = relationship("Order", back_populates="milestones")


class OrderTimelineLog(Base):
    """
    Model tabel `order_timeline_logs` (Modul M6.2):
    Menyimpan riwayat kabar/update progres dari tim teknis yang dapat dilihat klien
    di halaman Cek Status Order.
    """
    __tablename__ = "order_timeline_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=True)
    progress_percent = Column(Integer, nullable=False, default=0)
    is_public = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    order = relationship("Order", back_populates="timeline_logs")


class OrderPayment(Base):
    """
    Model tabel `order_payments` (Modul M8):
    Mencatat setiap transaksi pembayaran (DP, Cicilan, Pelunasan, Biaya Tambahan, atau Refund)
    sehingga sisa tagihan (remaining_balance) selalu akurat.
    """
    __tablename__ = "order_payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    payment_type = Column(
        String(30), nullable=False, default="dp"
    )  # dp | installment | final | extra | refund
    amount = Column(Integer, nullable=False)
    method = Column(
        String(30), nullable=False, default="transfer_bank"
    )  # transfer_bank | qris | ewallet | cash
    reference_note = Column(String(255), nullable=True)
    status = Column(
        String(30), nullable=False, default="verified"
    )  # pending | verified | rejected
    verified_by = Column(String(100), nullable=True)
    paid_at = Column(DateTime, default=utc_now)

    order = relationship("Order", back_populates="payments")


class Revision(Base):
    """
    Model tabel `revisions` (Modul M7):
    Menyimpan pengajuan revisi dari klien beserta balasan resmi tim teknis (`admin_response`),
    status pengerjaan revisi, dan penanda `is_out_of_scope` bila di luar kesepakatan awal.
    """
    __tablename__ = "revisions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    notes = Column(Text, nullable=False)
    status = Column(
        String(30), default="submitted"
    )  # submitted | in_progress | completed | rejected
    admin_response = Column(Text, nullable=True)
    is_out_of_scope = Column(Boolean, default=False, nullable=False)
    extra_cost = Column(Integer, default=0, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    order = relationship("Order", back_populates="revisions")
