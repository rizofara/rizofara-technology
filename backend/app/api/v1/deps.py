from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.admin_user import AdminUser

# Skema Bearer Token untuk Swagger UI (/docs) & Header Authorization
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    """
    Dependency FastAPI ("Penjaga Pintu") untuk memastikan endpoint hanya bisa diakses
    oleh Admin yang sudah login dan memiliki token JWT aktif.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akses ditolak. Silakan login sebagai Admin terlebih dahulu.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    admin_id = payload.get("sub")
    if not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak memiliki identitas admin yang valid.",
        )

    admin = db.query(AdminUser).filter(AdminUser.id == int(admin_id)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun admin tidak ditemukan.",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun admin Anda sedang dinonaktifkan. Hubungi Superadmin.",
        )

    return admin


def get_admin_permissions(admin: AdminUser, db: Session) -> List[str]:
    """
    Mengambil daftar permission milik admin berdasarkan role-nya (tabel `roles`).
    Superadmin selalu memiliki seluruh permission.
    """
    from app.models.role import Role, ALL_PERMISSIONS, DEFAULT_ROLES

    if admin.role == "superadmin":
        return list(ALL_PERMISSIONS)
    role = db.query(Role).filter(Role.name == admin.role).first()
    if role:
        if not role.is_active:
            return []
        return list(role.permissions or [])
    # Fallback ke definisi default jika tabel role belum memiliki entri
    return list(DEFAULT_ROLES.get(admin.role, {}).get("permissions", []))


def admin_has_permission(admin: AdminUser, db: Session, permission: str) -> bool:
    return permission in get_admin_permissions(admin, db)


def require_permission(*permissions: str):
    """
    Dependency factory: memastikan admin memiliki MINIMAL SATU dari permission yang diminta.
    Contoh: Depends(require_permission("orders.edit"))
    """

    def _checker(
        current_admin: AdminUser = Depends(get_current_admin),
        db: Session = Depends(get_db),
    ) -> AdminUser:
        perms = get_admin_permissions(current_admin, db)
        if not any(p in perms for p in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak. Role Anda tidak memiliki izin untuk fitur ini.",
            )
        return current_admin

    return _checker


def admin_can_access_order(admin: AdminUser, db: Session, order) -> bool:
    """
    Admin dengan `orders.view_all` bisa mengakses semua order.
    Role dengan `orders.view_assigned` (misal Freelance) hanya order yang PIC-nya dirinya.
    """
    perms = get_admin_permissions(admin, db)
    if "orders.view_all" in perms:
        return True
    if "orders.view_assigned" in perms:
        return is_order_assigned_to(order, admin)
    return False


def is_order_assigned_to(order, admin: AdminUser) -> bool:
    pic = (order.assigned_to or "").strip().lower()
    name = (admin.name or "").strip().lower()
    if not pic or not name:
        return False
    return pic == name or pic.startswith(name) or name in pic


def require_superadmin(
    current_admin: AdminUser = Depends(get_current_admin),
) -> AdminUser:
    """
    Dependency tambahan khusus untuk fitur sensitif yang hanya boleh diakses
    oleh `superadmin` (misal: tambah/hapus akun admin lain, pengaturan sistem).
    """
    if current_admin.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses terbatas. Fitur ini hanya dapat diakses oleh Superadmin.",
        )
    return current_admin
