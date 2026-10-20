from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Kode role unik, huruf kecil tanpa spasi (misal: freelance)")
    display_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    permissions: List[str] = []
    is_active: bool = True


class RoleUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: List[str] = []
    is_system: bool
    is_active: bool
    user_count: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PermissionInfo(BaseModel):
    code: str
    label: str
    group: str
