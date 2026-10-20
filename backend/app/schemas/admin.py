from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class LoginRequest(BaseModel):
    email: str = Field(..., description="Email admin")
    password: str = Field(..., min_length=4, description="Password admin")


class AdminProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    title: Optional[str] = None
    bio: Optional[str] = None
    whatsapp: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    permissions: List[str] = []
    role_display_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    admin: AdminProfileResponse


class AdminProfileUpdate(BaseModel):
    """Schema untuk CRUD Update Profil Admin yang sedang login."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None, min_length=5, max_length=150)
    title: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    whatsapp: Optional[str] = Field(None, max_length=30)
    avatar_url: Optional[str] = Field(None, max_length=500)


class ChangePasswordRequest(BaseModel):
    """Schema untuk mengganti password sendiri (wajib isi password lama)."""
    current_password: str = Field(..., min_length=4)
    new_password: str = Field(..., min_length=8, description="Minimal 8 karakter")
    confirm_password: str = Field(..., min_length=8)


class AdminUserCreate(BaseModel):
    """Schema untuk Superadmin saat menambahkan akun admin baru."""
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=8, description="Password minimal 8 karakter")
    role: str = Field("admin", min_length=2, max_length=50)
    title: Optional[str] = None
    bio: Optional[str] = None
    whatsapp: Optional[str] = None


class AdminUserUpdate(BaseModel):
    """Schema untuk Superadmin saat mengubah akun admin lain."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None, min_length=5, max_length=150)
    role: Optional[str] = Field(None, min_length=2, max_length=50)
    title: Optional[str] = None
    bio: Optional[str] = None
    whatsapp: Optional[str] = None
    is_active: Optional[bool] = None
    new_password: Optional[str] = Field(None, min_length=8)
