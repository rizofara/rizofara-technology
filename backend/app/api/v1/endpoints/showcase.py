import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_admin
from app.models.admin_user import AdminUser
from app.models.order import Order
from app.models.showcase import Testimonial, PortfolioItem
from app.schemas.showcase import (
    TestimonialCreateAdmin,
    TestimonialSubmitClient,
    TestimonialUpdate,
    TestimonialResponse,
    PortfolioItemCreate,
    PortfolioItemUpdate,
    PortfolioItemResponse,
    ShowcasePublicResponse,
    RatingSummary,
)
from app.seed import seed_initial_showcase

router = APIRouter()


def _make_initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "KL"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "portfolio-item"


def _ensure_unique_slug(db: Session, base_slug: str, exclude_id: Optional[int] = None) -> str:
    candidate = base_slug
    counter = 2
    while True:
        q = db.query(PortfolioItem).filter(PortfolioItem.slug == candidate)
        if exclude_id is not None:
            q = q.filter(PortfolioItem.id != exclude_id)
        if not q.first():
            return candidate
        candidate = f"{base_slug}-{counter}"
        counter += 1


# =====================================================
# 1. PUBLIC ENDPOINTS (Katalog Portofolio & Testimoni)
# =====================================================
@router.get("/public", response_model=ShowcasePublicResponse)
def get_public_showcase(db: Session = Depends(get_db)):
    """
    Mengambil data Portofolio (`is_published=True` & `client_consent=True`)
    dan Testimoni (`status='approved'` & `consent_publish=True`) beserta ringkasan rating.
    """
    seed_initial_showcase(db)

    portfolios = (
        db.query(PortfolioItem)
        .filter(
            PortfolioItem.is_published == True,  # noqa: E712
            PortfolioItem.client_consent == True,  # noqa: E712
        )
        .order_by(PortfolioItem.display_order.asc(), PortfolioItem.id.desc())
        .all()
    )

    testimonials = (
        db.query(Testimonial)
        .filter(
            Testimonial.status == "approved",
            Testimonial.consent_publish == True,  # noqa: E712
        )
        .order_by(Testimonial.display_order.asc(), Testimonial.id.desc())
        .all()
    )

    total_reviews = len(testimonials)
    if total_reviews > 0:
        avg_rating = round(sum(t.rating for t in testimonials) / total_reviews, 1)
    else:
        avg_rating = 5.0

    verified_count = sum(1 for t in testimonials if t.source == "client" or bool(t.order_code))

    return ShowcasePublicResponse(
        portfolio_items=portfolios,
        testimonials=testimonials,
        rating_summary=RatingSummary(
            average_rating=avg_rating,
            total_reviews=total_reviews,
            verified_count=verified_count,
        ),
    )


@router.post("/testimonials/submit", response_model=TestimonialResponse)
def submit_client_testimonial(
    payload: TestimonialSubmitClient,
    db: Session = Depends(get_db),
):
    """
    Endpoint publik bagi klien yang ordernya sudah selesai (`completed`)
    untuk mengirimkan ulasan/testimoni.
    Status awal otomatis `pending` (menunggu moderasi Admin).
    """
    code_clean = payload.order_code.strip().upper()
    order = db.query(Order).filter(Order.order_code == code_clean).first()
    if not order:
        raise HTTPException(status_code=404, detail="Kode Order tidak ditemukan.")

    wa_digits = re.sub(r"\D", "", order.client_whatsapp or "")
    input_digits = re.sub(r"\D", "", payload.wa_last4 or "")
    if len(input_digits) != 4 or not wa_digits.endswith(input_digits):
        raise HTTPException(
            status_code=403,
            detail="Verifikasi gagal: 4 digit terakhir nomor WhatsApp tidak cocok dengan data order.",
        )

    status_val = order.status.value if hasattr(order.status, "value") else str(order.status)
    if status_val != "completed":
        raise HTTPException(
            status_code=400,
            detail="Testimoni hanya dapat dikirim untuk pesanan yang sudah berstatus Selesai (completed).",
        )

    existing = db.query(Testimonial).filter(Testimonial.order_code == code_clean).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Pesanan ini sudah pernah mengirimkan testimoni sebelumnya.",
        )

    new_testimonial = Testimonial(
        client_name=payload.client_name.strip(),
        client_role=payload.client_role.strip(),
        project_label=(payload.project_label or order.title).strip(),
        tag=(payload.tag or "Klien Terverifikasi").strip(),
        comment=payload.comment.strip(),
        rating=payload.rating,
        avatar_initials=_make_initials(payload.client_name),
        avatar_color="from-teal-500 to-emerald-600",
        order_code=code_clean,
        source="client",
        status="pending",
        is_featured=True,
        consent_publish=payload.consent_publish,
        display_order=10,
    )
    db.add(new_testimonial)
    db.commit()
    db.refresh(new_testimonial)
    return new_testimonial


# =====================================================
# 2. ADMIN ENDPOINTS — CRUD & MODERASI TESTIMONI (M9)
# =====================================================
@router.get("/testimonials", response_model=List[TestimonialResponse])
def list_all_testimonials_admin(
    status: Optional[str] = Query(None, description="Filter status: pending, approved, rejected"),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    seed_initial_showcase(db)
    query = db.query(Testimonial)
    if status:
        query = query.filter(Testimonial.status == status)
    return query.order_by(Testimonial.display_order.asc(), Testimonial.id.desc()).all()


@router.post("/testimonials", response_model=TestimonialResponse)
def create_testimonial_admin(
    payload: TestimonialCreateAdmin,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    initials = payload.avatar_initials or _make_initials(payload.client_name)
    new_item = Testimonial(
        client_name=payload.client_name.strip(),
        client_role=payload.client_role.strip(),
        project_label=payload.project_label,
        tag=payload.tag or "Klien Terverifikasi",
        comment=payload.comment.strip(),
        rating=payload.rating,
        avatar_initials=initials,
        avatar_color=payload.avatar_color,
        order_code=payload.order_code.strip().upper() if payload.order_code else None,
        source="admin",
        status=payload.status or "approved",
        is_featured=payload.is_featured,
        consent_publish=payload.consent_publish,
        display_order=payload.display_order,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.patch("/testimonials/{testimonial_id}", response_model=TestimonialResponse)
def update_testimonial_admin(
    testimonial_id: int,
    payload: TestimonialUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Testimoni tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    if "client_name" in update_data and not item.avatar_initials:
        item.avatar_initials = _make_initials(item.client_name)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/testimonials/{testimonial_id}")
def delete_testimonial_admin(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Testimoni tidak ditemukan.")
    db.delete(item)
    db.commit()
    return {"message": "Testimoni berhasil dihapus."}


# =====================================================
# 3. ADMIN ENDPOINTS — CRUD PORTOFOLIO (M10)
# =====================================================
@router.get("/portfolio", response_model=List[PortfolioItemResponse])
def list_all_portfolio_admin(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    seed_initial_showcase(db)
    return (
        db.query(PortfolioItem)
        .order_by(PortfolioItem.display_order.asc(), PortfolioItem.id.desc())
        .all()
    )


@router.post("/portfolio", response_model=PortfolioItemResponse)
def create_portfolio_admin(
    payload: PortfolioItemCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    if payload.is_published and not payload.client_consent:
        raise HTTPException(
            status_code=400,
            detail="Portofolio tidak dapat dipublikasikan (is_published=True) tanpa izin klien (client_consent=True).",
        )

    base_slug = _slugify(payload.slug or payload.title)
    unique_slug = _ensure_unique_slug(db, base_slug)

    new_item = PortfolioItem(
        title=payload.title.strip(),
        slug=unique_slug,
        category=payload.category.strip(),
        badge_color=payload.badge_color,
        summary=payload.summary.strip(),
        content=payload.content,
        tech_tags=payload.tech_tags or [],
        highlight_metric=payload.highlight_metric,
        thumbnail_url=payload.thumbnail_url,
        demo_url=payload.demo_url,
        repo_url=payload.repo_url,
        client_consent=payload.client_consent,
        is_published=payload.is_published,
        is_featured=payload.is_featured,
        display_order=payload.display_order,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.patch("/portfolio/{item_id}", response_model=PortfolioItemResponse)
def update_portfolio_admin(
    item_id: int,
    payload: PortfolioItemUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item portofolio tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)

    # Cek aturan bisnis client_consent vs is_published
    next_consent = update_data.get("client_consent", item.client_consent)
    next_published = update_data.get("is_published", item.is_published)
    if next_published and not next_consent:
        raise HTTPException(
            status_code=400,
            detail="Portofolio tidak dapat dipublikasikan tanpa izin klien (client_consent=True).",
        )

    if "slug" in update_data and update_data["slug"]:
        base_slug = _slugify(update_data["slug"])
        update_data["slug"] = _ensure_unique_slug(db, base_slug, exclude_id=item.id)

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/portfolio/{item_id}")
def delete_portfolio_admin(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item portofolio tidak ditemukan.")
    db.delete(item)
    db.commit()
    return {"message": "Item portofolio berhasil dihapus."}
