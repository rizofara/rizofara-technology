import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.role import Role, ALL_PERMISSIONS, PERMISSION_LABELS
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse, PermissionInfo
from app.api.v1.deps import get_current_admin, require_permission

router = APIRouter()


def serialize_role(role: Role, db: Session) -> RoleResponse:
    resp = RoleResponse.model_validate(role)
    resp.user_count = db.query(AdminUser).filter(AdminUser.role == role.name).count()
    return resp


def clean_permissions(perms: List[str]) -> List[str]:
    invalid = [p for p in perms if p not in ALL_PERMISSIONS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Permission tidak dikenal: {', '.join(invalid)}")
    # Pertahankan urutan baku
    return [p for p in ALL_PERMISSIONS if p in perms]


@router.get("/permissions", response_model=List[PermissionInfo])
def list_permissions(current_admin: AdminUser = Depends(get_current_admin)):
    """Daftar seluruh permission yang tersedia (untuk checklist di UI Kelola Role)."""
    return [
        PermissionInfo(code=code, label=PERMISSION_LABELS.get(code, (code, "Lainnya"))[0],
                       group=PERMISSION_LABELS.get(code, (code, "Lainnya"))[1])
        for code in ALL_PERMISSIONS
    ]


@router.get("/", response_model=List[RoleResponse])
def list_roles(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Daftar role (dapat diakses semua admin, untuk dropdown pemilihan role)."""
    roles = db.query(Role).order_by(Role.is_system.desc(), Role.id.asc()).all()
    return [serialize_role(r, db) for r in roles]


@router.post("/", response_model=RoleResponse, status_code=201)
def create_role(
    data: RoleCreate,
    current_admin: AdminUser = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    name = re.sub(r"[^a-z0-9_]", "_", data.name.strip().lower()).strip("_")
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Kode role minimal 2 karakter (huruf/angka/underscore).")
    if db.query(Role).filter(Role.name == name).first():
        raise HTTPException(status_code=400, detail=f"Role dengan kode '{name}' sudah ada.")

    role = Role(
        name=name,
        display_name=data.display_name.strip(),
        description=(data.description or "").strip() or None,
        permissions=clean_permissions(data.permissions),
        is_system=False,
        is_active=data.is_active,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return serialize_role(role, db)


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    data: RoleUpdate,
    current_admin: AdminUser = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role tidak ditemukan.")
    if role.name == "superadmin" and (data.permissions is not None or data.is_active is False):
        raise HTTPException(status_code=400, detail="Hak akses role Superadmin tidak dapat diubah atau dinonaktifkan.")

    if data.display_name is not None:
        role.display_name = data.display_name.strip()
    if data.description is not None:
        role.description = data.description.strip() or None
    if data.permissions is not None:
        role.permissions = clean_permissions(data.permissions)
    if data.is_active is not None:
        role.is_active = data.is_active

    db.commit()
    db.refresh(role)
    return serialize_role(role, db)


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    current_admin: AdminUser = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role tidak ditemukan.")
    if role.is_system:
        raise HTTPException(status_code=400, detail="Role bawaan sistem tidak dapat dihapus (bisa dinonaktifkan/diedit).")
    used = db.query(AdminUser).filter(AdminUser.role == role.name).count()
    if used > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Role '{role.display_name}' masih dipakai oleh {used} akun. Pindahkan akun tersebut ke role lain terlebih dahulu.",
        )
    name = role.display_name
    db.delete(role)
    db.commit()
    return {"message": f"Role '{name}' berhasil dihapus."}
