import re
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_admin, require_superadmin
from app.api.v1.endpoints.orders import compute_order_financials
from app.models.admin_user import AdminUser
from app.models.order import Order, Revision
from app.models.showcase import Testimonial
from app.models.cms import SiteSetting, FaqItem, TechStackItem
from app.schemas.cms import (
    SiteSettingItem,
    SiteSettingBatchUpdate,
    FaqItemCreate,
    FaqItemUpdate,
    FaqItemResponse,
    TechStackItemCreate,
    TechStackItemUpdate,
    TechStackItemResponse,
    CmsPublicBundle,
    DashboardSummaryResponse,
)
from app.seed import seed_initial_cms, seed_initial_showcase
from app.services.backup import create_database_backup, list_database_backups

router = APIRouter()


def _normalize_wa_number(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("08"):
        digits = "62" + digits[1:]
    elif digits.startswith("8"):
        digits = "62" + digits
    return digits


# =====================================================
# 1. PUBLIC ENDPOINT - BUNDLE CMS (Settings, FAQ, TechStack)
# =====================================================
@router.get("/public", response_model=CmsPublicBundle)
def get_public_cms_bundle(db: Session = Depends(get_db)):
    """
    Mengambil seluruh pengaturan situs publik (`site_settings`),
    daftar FAQ aktif (`faqs`), dan daftar Tech Stack aktif (`tech_stacks`).
    """
    seed_initial_cms(db)

    settings_rows = db.query(SiteSetting).all()
    settings_dict: Dict[str, str] = {r.key: r.value for r in settings_rows}

    faqs = (
        db.query(FaqItem)
        .filter(FaqItem.is_published == True)  # noqa: E712
        .order_by(FaqItem.display_order.asc(), FaqItem.id.asc())
        .all()
    )

    tech_stacks = (
        db.query(TechStackItem)
        .filter(TechStackItem.is_published == True)  # noqa: E712
        .order_by(TechStackItem.display_order.asc(), TechStackItem.id.asc())
        .all()
    )

    return CmsPublicBundle(
        settings=settings_dict,
        faqs=faqs,
        tech_stacks=tech_stacks,
    )


# =====================================================
# 2. ADMIN ENDPOINT - RINGKASAN DASHBOARD & KEUANGAN (Modul M12)
# =====================================================
@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
def get_admin_dashboard_summary(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """
    Menghitung metrik ringkasan operasional & keuangan untuk Dashboard Admin (Modul M12):
    - Jumlah order total, aktif, selesai, dan dibatalkan
    - Total pemasukan terverifikasi (verified revenue) & total piutang (sisa tagihan)
    - Jumlah revisi menunggu (`submitted`) & testimoni menunggu moderasi (`pending`)
    - Distribusi order per layanan & persentase konversi penyelesaian
    """
    seed_initial_showcase(db)
    orders = db.query(Order).all()

    total_orders = len(orders)
    completed_orders = 0
    cancelled_orders = 0
    active_orders = 0
    total_verified_revenue = 0
    total_outstanding = 0
    orders_by_service: Dict[str, int] = {}

    for o in orders:
        fin = compute_order_financials(o)
        st = str(o.status or "pending")
        svc = str(o.service_type or "lainnya")
        orders_by_service[svc] = orders_by_service.get(svc, 0) + 1

        if st == "completed":
            completed_orders += 1
        elif st == "cancelled":
            cancelled_orders += 1
        else:
            active_orders += 1

        if st != "cancelled":
            total_verified_revenue += int(fin.get("total_paid", 0) or 0)
            if st != "pending":
                total_outstanding += int(fin.get("remaining_balance", 0) or 0)

    pending_revisions_count = (
        db.query(Revision).filter(Revision.status == "submitted").count()
    )
    pending_testimonials_count = (
        db.query(Testimonial).filter(Testimonial.status == "pending").count()
    )

    non_cancelled = total_orders - cancelled_orders
    conversion_rate = (
        round((completed_orders / non_cancelled) * 100, 1) if non_cancelled > 0 else 0.0
    )

    return DashboardSummaryResponse(
        total_orders=total_orders,
        active_orders=active_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        total_verified_revenue=total_verified_revenue,
        total_outstanding_receivables=total_outstanding,
        pending_revisions_count=pending_revisions_count,
        pending_testimonials_count=pending_testimonials_count,
        orders_by_service=orders_by_service,
        conversion_rate_percent=conversion_rate,
    )


# =====================================================
# 3. ADMIN ENDPOINTS - SITE SETTINGS / PROFIL BISNIS (Modul M2.A)
# =====================================================
@router.get("/settings", response_model=List[SiteSettingItem])
def list_site_settings(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    seed_initial_cms(db)
    return db.query(SiteSetting).order_by(SiteSetting.id.asc()).all()


@router.put("/settings", response_model=Dict[str, str])
def update_site_settings_batch(
    payload: SiteSettingBatchUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_superadmin),
):
    """
    Memperbarui nilai pengaturan situs (`site_settings`).
    Sesuai Aturan Bisnis M2.A:
    1. Hanya `superadmin` yang diizinkan mengubah pengaturan profil bisnis global.
    2. `whatsapp_number` otomatis dinormalisasi ke awalan `628...`.
    """
    seed_initial_cms(db)

    for key, val in payload.settings.items():
        clean_val = str(val).strip()
        if key == "whatsapp_number":
            clean_val = _normalize_wa_number(clean_val)
            if len(clean_val) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="Nomor WhatsApp tidak valid (minimal 10 digit).",
                )

        row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
        if row:
            row.value = clean_val
        else:
            db.add(SiteSetting(key=key, value=clean_val, group="custom"))

    db.commit()
    all_rows = db.query(SiteSetting).all()
    return {r.key: r.value for r in all_rows}


# =====================================================
# 4. ADMIN ENDPOINTS - CRUD FAQ (Modul M11)
# =====================================================
@router.get("/faqs", response_model=List[FaqItemResponse])
def list_all_faqs_admin(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    seed_initial_cms(db)
    return db.query(FaqItem).order_by(FaqItem.display_order.asc(), FaqItem.id.asc()).all()


@router.post("/faqs", response_model=FaqItemResponse)
def create_faq_admin(
    payload: FaqItemCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = FaqItem(
        question=payload.question.strip(),
        answer=payload.answer.strip(),
        category=payload.category.strip(),
        is_published=payload.is_published,
        display_order=payload.display_order,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/faqs/{faq_id}", response_model=FaqItemResponse)
def update_faq_admin(
    faq_id: int,
    payload: FaqItemUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(FaqItem).filter(FaqItem.id == faq_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="FAQ tidak ditemukan.")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/faqs/{faq_id}")
def delete_faq_admin(
    faq_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(FaqItem).filter(FaqItem.id == faq_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="FAQ tidak ditemukan.")
    db.delete(item)
    db.commit()
    return {"message": "FAQ berhasil dihapus."}


# =====================================================
# 5. ADMIN ENDPOINTS - CRUD TECH STACK (Modul M11)
# =====================================================
@router.get("/tech-stacks", response_model=List[TechStackItemResponse])
def list_all_tech_stacks_admin(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    seed_initial_cms(db)
    return (
        db.query(TechStackItem)
        .order_by(TechStackItem.display_order.asc(), TechStackItem.id.asc())
        .all()
    )


@router.post("/tech-stacks", response_model=TechStackItemResponse)
def create_tech_stack_admin(
    payload: TechStackItemCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = TechStackItem(
        name=payload.name.strip(),
        emoji=payload.emoji.strip(),
        color=payload.color.strip(),
        is_highlighted=payload.is_highlighted,
        is_published=payload.is_published,
        display_order=payload.display_order,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/tech-stacks/{tech_id}", response_model=TechStackItemResponse)
def update_tech_stack_admin(
    tech_id: int,
    payload: TechStackItemUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(TechStackItem).filter(TechStackItem.id == tech_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tech stack tidak ditemukan.")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/tech-stacks/{tech_id}")
def delete_tech_stack_admin(
    tech_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    item = db.query(TechStackItem).filter(TechStackItem.id == tech_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tech stack tidak ditemukan.")
    db.delete(item)
    db.commit()
    return {"message": "Tech stack berhasil dihapus."}


# =====================================================
# 6. ADMIN ENDPOINTS - DATABASE BACKUP SNAPSHOT (Fase 6)
# =====================================================
@router.get("/backups")
def list_backups_admin(
    current_admin: AdminUser = Depends(require_superadmin),
):
    """
    Mengambil daftar snapshot backup database SQLite yang tersimpan di `storage/backups/`.
    Hanya dapat diakses oleh Superadmin.
    """
    return list_database_backups()


@router.post("/backups")
def trigger_backup_admin(
    current_admin: AdminUser = Depends(require_superadmin),
):
    """
    Membuat snapshot hot-backup database SQLite secara langsung dan menerapkan
    kebijakan retensi maksimal 14 file terbaru (PRD §11).
    """
    return create_database_backup(max_keep=14)

