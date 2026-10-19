from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# =====================================================
# SCHEMAS UNTUK TESTIMONI (Modul M9)
# =====================================================
class TestimonialBase(BaseModel):
    client_name: str = Field(..., min_length=2, max_length=100)
    client_role: str = Field(..., min_length=2, max_length=100)
    project_label: Optional[str] = Field(None, max_length=150)
    tag: Optional[str] = Field("Klien Terverifikasi", max_length=50)
    comment: str = Field(..., min_length=10, max_length=800)
    rating: int = Field(5, ge=1, le=5)
    avatar_initials: Optional[str] = Field(None, max_length=10)
    avatar_color: str = Field("from-teal-500 to-emerald-600", max_length=80)
    is_featured: bool = True
    consent_publish: bool = True
    display_order: int = 0


class TestimonialCreateAdmin(TestimonialBase):
    order_code: Optional[str] = None
    status: str = "approved"


class TestimonialSubmitClient(BaseModel):
    order_code: str = Field(..., min_length=4, max_length=30)
    wa_last4: str = Field(..., min_length=4, max_length=4)
    client_name: str = Field(..., min_length=2, max_length=100)
    client_role: str = Field(..., min_length=2, max_length=100)
    project_label: Optional[str] = Field(None, max_length=150)
    tag: Optional[str] = Field("Klien Terverifikasi", max_length=50)
    comment: str = Field(..., min_length=10, max_length=800)
    rating: int = Field(5, ge=1, le=5)
    consent_publish: bool = True


class TestimonialUpdate(BaseModel):
    client_name: Optional[str] = None
    client_role: Optional[str] = None
    project_label: Optional[str] = None
    tag: Optional[str] = None
    comment: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    avatar_initials: Optional[str] = None
    avatar_color: Optional[str] = None
    status: Optional[str] = None  # 'pending' | 'approved' | 'rejected'
    is_featured: Optional[bool] = None
    consent_publish: Optional[bool] = None
    display_order: Optional[int] = None


class TestimonialResponse(TestimonialBase):
    id: int
    order_code: Optional[str] = None
    source: str
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# SCHEMAS UNTUK PORTOFOLIO (Modul M10)
# =====================================================
class PortfolioItemBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    slug: Optional[str] = Field(None, max_length=200)
    category: str = Field(..., min_length=2, max_length=80)
    badge_color: str = Field("teal", max_length=30)
    summary: str = Field(..., min_length=10, max_length=500)
    content: Optional[str] = None
    tech_tags: List[str] = Field(default_factory=list)
    highlight_metric: Optional[str] = Field(None, max_length=100)
    thumbnail_url: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    client_consent: bool = True
    is_published: bool = True
    is_featured: bool = True
    display_order: int = 0


class PortfolioItemCreate(PortfolioItemBase):
    pass


class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    badge_color: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    tech_tags: Optional[List[str]] = None
    highlight_metric: Optional[str] = None
    thumbnail_url: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    client_consent: Optional[bool] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    display_order: Optional[int] = None


class PortfolioItemResponse(PortfolioItemBase):
    id: int
    slug: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RatingSummary(BaseModel):
    average_rating: float
    total_reviews: int
    verified_count: int


class ShowcasePublicResponse(BaseModel):
    portfolio_items: List[PortfolioItemResponse]
    testimonials: List[TestimonialResponse]
    rating_summary: RatingSummary
