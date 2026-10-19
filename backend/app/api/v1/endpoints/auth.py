import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.models.admin_user import AdminUser
from app.schemas.admin import (
    LoginRequest,
    TokenResponse,
    AdminProfileResponse,
    AdminProfileUpdate,
    ChangePasswordRequest,
    AdminUserCreate,
    AdminUserUpdate,
)
from app.api.v1.deps import get_current_admin, require_superadmin
from app.services.storage import save_public_media_file

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login_admin(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentikasi Admin menggunakan Email & Password.
    Jika berhasil, mengembalikan JWT Access Token beserta profil Admin.
    """
    clean_email = data.email.strip().lower()
    admin = (
        db.query(AdminUser)
        .filter(func.lower(AdminUser.email) == clean_email)
        .first()
    )

    # Gunakan pesan generik yang sama agar penyerang tidak bisa menebak email mana yang terdaftar
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah.",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda sedang dinonaktifkan. Silakan hubungi Superadmin.",
        )

    # Catat waktu login terakhir
    admin.last_login_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(admin)

    token = create_access_token(subject=admin.id, role=admin.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        admin=AdminProfileResponse.model_validate(admin),
    )


@router.get("/me", response_model=AdminProfileResponse)
def get_my_profile(current_admin: AdminUser = Depends(get_current_admin)):
    """Mengambil data profil Admin yang sedang login."""
    return current_admin


@router.patch("/me", response_model=AdminProfileResponse)
def update_my_profile(
    data: AdminProfileUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    CRUD Update Profil Admin yang sedang login (nama, email, jabatan/title, bio, nomor WA, avatar).
    """
    if data.email is not None:
        new_email = data.email.strip().lower()
        existing = (
            db.query(AdminUser)
            .filter(
                func.lower(AdminUser.email) == new_email,
                AdminUser.id != current_admin.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email tersebut sudah digunakan oleh akun admin lain.",
            )
        current_admin.email = new_email

    if data.name is not None:
        current_admin.name = data.name.strip()
    if data.title is not None:
        current_admin.title = data.title.strip()
    if data.bio is not None:
        current_admin.bio = data.bio.strip()
    if data.whatsapp is not None:
        current_admin.whatsapp = data.whatsapp.strip()
    if data.avatar_url is not None:
        current_admin.avatar_url = data.avatar_url.strip()

    db.commit()
    db.refresh(current_admin)
    return current_admin


@router.post("/me/avatar", response_model=AdminProfileResponse)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Mengunggah foto profil (avatar) untuk Admin yang sedang login."""
    public_url, _, _ = await save_public_media_file(
        file=file, prefix=f"avatar_{current_admin.id}"
    )
    current_admin.avatar_url = public_url
    db.commit()
    db.refresh(current_admin)
    return current_admin


@router.post("/change-password")
def change_my_password(
    data: ChangePasswordRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Mengganti password akun sendiri. Wajib memverifikasi password lama terlebih dahulu.
    """
    if not verify_password(data.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Password saat ini yang Anda masukkan salah.",
        )

    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Konfirmasi password baru tidak cocok.",
        )

    current_admin.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password berhasil diperbarui."}


# --- MANAJEMEN AKUN TIM ADMIN (CRUD) ---

@router.get("/users", response_model=List[AdminProfileResponse])
def list_admin_users(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Melihat daftar seluruh akun admin/co-founder (dapat diakses semua admin untuk keperluan
    assignment order).
    """
    return db.query(AdminUser).order_by(AdminUser.id.asc()).all()


@router.post("/users", response_model=AdminProfileResponse, status_code=201)
def create_admin_user(
    data: AdminUserCreate,
    superadmin: AdminUser = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    """Khusus Superadmin: Menambahkan akun admin baru ke dalam tim."""
    clean_email = data.email.strip().lower()
    exists = (
        db.query(AdminUser)
        .filter(func.lower(AdminUser.email) == clean_email)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=400, detail="Email sudah terdaftar sebagai admin."
        )

    new_admin = AdminUser(
        name=data.name.strip(),
        email=clean_email,
        password_hash=hash_password(data.password),
        role=data.role,
        title=data.title,
        bio=data.bio,
        whatsapp=data.whatsapp,
        is_active=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin


@router.patch("/users/{user_id}", response_model=AdminProfileResponse)
def update_admin_user(
    user_id: int,
    data: AdminUserUpdate,
    superadmin: AdminUser = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    """Khusus Superadmin: Mengubah data, role, status aktif, atau mereset password admin lain."""
    target = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Akun admin tidak ditemukan.")

    # Cegah Superadmin menonaktifkan atau menurunkan role dirinya sendiri
    if target.id == superadmin.id:
        if data.is_active is False:
            raise HTTPException(
                status_code=400,
                detail="Anda tidak dapat menonaktifkan akun Anda sendiri.",
            )
        if data.role and data.role != "superadmin":
            raise HTTPException(
                status_code=400,
                detail="Anda tidak dapat menurunkan role Superadmin Anda sendiri.",
            )

    if data.email is not None:
        clean_email = data.email.strip().lower()
        dup = (
            db.query(AdminUser)
            .filter(
                func.lower(AdminUser.email) == clean_email,
                AdminUser.id != target.id,
            )
            .first()
        )
        if dup:
            raise HTTPException(status_code=400, detail="Email sudah digunakan.")
        target.email = clean_email

    if data.name is not None:
        target.name = data.name.strip()
    if data.role is not None:
        target.role = data.role
    if data.title is not None:
        target.title = data.title
    if data.bio is not None:
        target.bio = data.bio
    if data.whatsapp is not None:
        target.whatsapp = data.whatsapp
    if data.is_active is not None:
        target.is_active = data.is_active
    if data.new_password:
        target.password_hash = hash_password(data.new_password)

    db.commit()
    db.refresh(target)
    return target


@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: int,
    superadmin: AdminUser = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    """Khusus Superadmin: Menghapus akun admin lain."""
    target = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Akun admin tidak ditemukan.")

    if target.id == superadmin.id:
        raise HTTPException(
            status_code=400,
            detail="Anda tidak dapat menghapus akun Anda sendiri.",
        )

    db.delete(target)
    db.commit()
    return {"message": f"Akun admin '{target.name}' berhasil dihapus."}
