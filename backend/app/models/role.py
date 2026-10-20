import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from app.db.session import Base


def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class Role(Base):
    """
    Model tabel `roles` untuk menyimpan definisi role dan permission-nya.
    Mendukung CRUD role dinamis oleh superadmin.
    """
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)       # e.g. "superadmin", "admin", "freelance"
    display_name = Column(String(100), nullable=False)                        # e.g. "Super Admin", "Admin", "Freelance"
    description = Column(Text, nullable=True)
    permissions = Column(JSON, nullable=False, default=[])                    # list of permission strings
    is_system = Column(Boolean, default=False, nullable=False)                # built-in roles can't be deleted
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# All available permissions in the system
ALL_PERMISSIONS = [
    "dashboard.view",
    "orders.view_all",
    "orders.view_assigned",
    "orders.create",
    "orders.edit",
    "orders.delete",
    "progress.view",
    "progress.create",
    "progress.edit",
    "progress.delete",
    "payments.view",
    "payments.create",
    "payments.delete",
    "pricing.manage",
    "showcase.manage",
    "cms.manage",
    "users.manage",
    "roles.manage",
]

# Label & grup permission (ditampilkan di UI Kelola Role)
PERMISSION_LABELS = {
    "dashboard.view": ("Lihat Dashboard", "Dashboard"),
    "orders.view_all": ("Lihat Semua Order", "Order"),
    "orders.view_assigned": ("Lihat Order yang Di-PIC Saja", "Order"),
    "orders.create": ("Tambah Order", "Order"),
    "orders.edit": ("Edit Data Order", "Order"),
    "orders.delete": ("Hapus Order", "Order"),
    "progress.view": ("Lihat Progress", "Progress"),
    "progress.create": ("Tambah Progress/Milestone", "Progress"),
    "progress.edit": ("Edit Progress/Milestone", "Progress"),
    "progress.delete": ("Hapus Progress/Milestone", "Progress"),
    "payments.view": ("Lihat Pembayaran", "Keuangan"),
    "payments.create": ("Catat Pembayaran", "Keuangan"),
    "payments.delete": ("Hapus Pembayaran", "Keuangan"),
    "pricing.manage": ("Kelola Harga & Layanan", "Konten"),
    "showcase.manage": ("Kelola Portofolio & Testimoni", "Konten"),
    "cms.manage": ("Kelola CMS Website", "Konten"),
    "users.manage": ("Kelola Akun Tim", "Sistem"),
    "roles.manage": ("Kelola Role & Hak Akses", "Sistem"),
}

# Default role definitions
DEFAULT_ROLES = {
    "superadmin": {
        "display_name": "Super Admin",
        "description": "Akses penuh ke seluruh fitur sistem tanpa batasan.",
        "permissions": ALL_PERMISSIONS,
        "is_system": True,
    },
    "admin": {
        "display_name": "Admin",
        "description": "Akses ke semua fitur kecuali manajemen user dan role.",
        "permissions": [
            "dashboard.view",
            "orders.view_all",
            "orders.create",
            "orders.edit",
            "orders.delete",
            "progress.view",
            "progress.create",
            "progress.edit",
            "progress.delete",
            "payments.view",
            "payments.create",
            "payments.delete",
            "pricing.manage",
            "showcase.manage",
            "cms.manage",
        ],
        "is_system": True,
    },
    "freelance": {
        "display_name": "Freelance",
        "description": "Hanya bisa melihat dan mengelola progress order yang di-assign (PIC) ke dirinya.",
        "permissions": [
            "dashboard.view",
            "orders.view_assigned",
            "progress.view",
            "progress.create",
            "progress.edit",
            "progress.delete",
        ],
        "is_system": True,
    },
}
