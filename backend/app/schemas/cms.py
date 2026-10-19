from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# =====================================================
# 1. SITE SETTINGS SCHEMAS (Modul M2.A)
# =====================================================
class SiteSettingItem(BaseModel):
    key: str
    value: str
    group: str = "general"
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SiteSettingBatchUpdate(BaseModel):
    settings: Dict[str, str]


# =====================================================
# 2. FAQ SCHEMAS (Modul M11)
# =====================================================
class FaqItemBase(BaseModel):
    question: str = Field(..., min_length=5, max_length=255)
    answer: str = Field(..., min_length=5)
    category: str = Field("umum", max_length=40)
    is_published: bool = True
    display_order: int = 0


class FaqItemCreate(FaqItemBase):
    pass


class FaqItemUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None
    display_order: Optional[int] = None


class FaqItemResponse(FaqItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# 3. TECH STACK SCHEMAS (Modul M11)
# =====================================================
class TechStackItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    emoji: str = Field("💻", max_length=20)
    color: str = Field("text-teal-400", max_length=40)
    is_highlighted: bool = False
    is_published: bool = True
    display_order: int = 0


class TechStackItemCreate(TechStackItemBase):
    pass


class TechStackItemUpdate(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    is_highlighted: Optional[bool] = None
    is_published: Optional[bool] = None
    display_order: Optional[int] = None


class TechStackItemResponse(TechStackItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# 4. BUNDLE PUBLIK & STATISTIK DASHBOARD (Modul M12)
# =====================================================
class CmsPublicBundle(BaseModel):
    settings: Dict[str, str]
    faqs: List[FaqItemResponse]
    tech_stacks: List[TechStackItemResponse]


class DashboardSummaryResponse(BaseModel):
    total_orders: int
    active_orders: int
    completed_orders: int
    cancelled_orders: int
    total_verified_revenue: int
    total_outstanding_receivables: int
    pending_revisions_count: int
    pending_testimonials_count: int
    orders_by_service: Dict[str, int]
    conversion_rate_percent: float
