from typing import Optional
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
