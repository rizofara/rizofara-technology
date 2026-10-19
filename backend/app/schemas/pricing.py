from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# --- SERVICE CATALOG SCHEMAS (M3.A) ---

class ServiceCatalogBase(BaseModel):
    slug: str = Field(..., min_length=2, max_length=50, description="Slug unik, misal: skripsi, website, mobile_app")
    name: str = Field(..., min_length=3, max_length=120)
    short_label: str = Field(..., min_length=2, max_length=50)
    description: str = Field(..., min_length=5)
    features: List[str] = Field(default_factory=list)
    icon: str = Field(default="Code2", max_length=50)
    color: str = Field(default="teal", max_length=30)
    category: str = Field(default="akademik", pattern="^(akademik|bisnis)$")
    base_price_min: int = Field(..., ge=0)
    base_price_max: int = Field(..., ge=0)
    standard_days: int = Field(default=14, ge=1, le=365)
    min_days: int = Field(default=3, ge=1, le=365)
    max_days: int = Field(default=60, ge=1, le=365)
    is_active: bool = True
    display_order: int = 0


class ServiceCatalogCreate(ServiceCatalogBase):
    pass


class ServiceCatalogUpdate(BaseModel):
    slug: Optional[str] = Field(default=None, min_length=2, max_length=50)
    name: Optional[str] = Field(default=None, min_length=3, max_length=120)
    short_label: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = None
    features: Optional[List[str]] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = Field(default=None, pattern="^(akademik|bisnis)$")
    base_price_min: Optional[int] = Field(default=None, ge=0)
    base_price_max: Optional[int] = Field(default=None, ge=0)
    standard_days: Optional[int] = Field(default=None, ge=1, le=365)
    min_days: Optional[int] = Field(default=None, ge=1, le=365)
    max_days: Optional[int] = Field(default=None, ge=1, le=365)
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ServiceCatalogResponse(ServiceCatalogBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- PRICING FACTOR SCHEMAS (M3.B) ---

class PricingFactorBase(BaseModel):
    factor_type: str = Field(..., pattern="^(complexity|platform)$")
    code: str = Field(..., min_length=2, max_length=40)
    label: str = Field(..., min_length=2, max_length=80)
    description: Optional[str] = Field(default=None, max_length=255)
    multiplier: float = Field(..., ge=0.1, le=10.0)
    applicable_services: Optional[List[str]] = None
    is_default: bool = False
    is_active: bool = True
    display_order: int = 0


class PricingFactorCreate(PricingFactorBase):
    pass


class PricingFactorUpdate(BaseModel):
    factor_type: Optional[str] = Field(default=None, pattern="^(complexity|platform)$")
    code: Optional[str] = Field(default=None, min_length=2, max_length=40)
    label: Optional[str] = Field(default=None, min_length=2, max_length=80)
    description: Optional[str] = Field(default=None, max_length=255)
    multiplier: Optional[float] = Field(default=None, ge=0.1, le=10.0)
    applicable_services: Optional[List[str]] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class PricingFactorResponse(PricingFactorBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- PRICING ADDON SCHEMAS (M3.D) ---

class PricingAddonBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=40)
    label: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)
    price_type: str = Field(default="fixed", pattern="^(fixed|percent)$")
    price_min: int = Field(..., ge=0)
    price_max: int = Field(..., ge=0)
    benefit_text: str = Field(..., min_length=3, max_length=255)
    applicable_services: Optional[List[str]] = None
    is_default_checked: bool = False
    is_active: bool = True
    display_order: int = 0


class PricingAddonCreate(PricingAddonBase):
    pass


class PricingAddonUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=2, max_length=40)
    label: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)
    price_type: Optional[str] = Field(default=None, pattern="^(fixed|percent)$")
    price_min: Optional[int] = Field(default=None, ge=0)
    price_max: Optional[int] = Field(default=None, ge=0)
    benefit_text: Optional[str] = Field(default=None, min_length=3, max_length=255)
    applicable_services: Optional[List[str]] = None
    is_default_checked: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class PricingAddonResponse(PricingAddonBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- PUBLIC PRICING CONFIG BUNDLE (M4) ---

class PublicPricingConfigResponse(BaseModel):
    services: List[ServiceCatalogResponse]
    complexity_factors: List[PricingFactorResponse]
    platform_factors: List[PricingFactorResponse]
    addons: List[PricingAddonResponse]
    dp_percent: int = 40
    rounding_unit: int = 50000
