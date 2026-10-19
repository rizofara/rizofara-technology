from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.pricing import ServiceCatalog, PricingFactor, PricingAddon
from app.models.order import Order
from app.models.admin_user import AdminUser
from app.schemas.pricing import (
    ServiceCatalogCreate,
    ServiceCatalogUpdate,
    ServiceCatalogResponse,
    PricingFactorCreate,
    PricingFactorUpdate,
    PricingFactorResponse,
    PricingAddonCreate,
    PricingAddonUpdate,
    PricingAddonResponse,
    PublicPricingConfigResponse,
)
from app.api.v1.deps import get_current_admin
from app.seed import seed_initial_pricing

router = APIRouter()


def build_public_pricing_config(db: Session) -> PublicPricingConfigResponse:
    """
    Menyusun paket konfigurasi lengkap (Layanan Aktif, Faktor Kompleksitas,
    Faktor Platform, dan Add-on Aktif) untuk dikonsumsi Landing Page & Kalkulator.
    """
    if db.query(ServiceCatalog).count() == 0:
        seed_initial_pricing(db)

    services = (
        db.query(ServiceCatalog)
        .filter(ServiceCatalog.is_active == True)
        .order_by(ServiceCatalog.display_order.asc(), ServiceCatalog.id.asc())
        .all()
    )
    complexity_factors = (
        db.query(PricingFactor)
        .filter(
            PricingFactor.factor_type == "complexity",
            PricingFactor.is_active == True,
        )
        .order_by(PricingFactor.display_order.asc(), PricingFactor.id.asc())
        .all()
    )
    platform_factors = (
        db.query(PricingFactor)
        .filter(
            PricingFactor.factor_type == "platform",
            PricingFactor.is_active == True,
        )
        .order_by(PricingFactor.display_order.asc(), PricingFactor.id.asc())
        .all()
    )
    addons = (
        db.query(PricingAddon)
        .filter(PricingAddon.is_active == True)
        .order_by(PricingAddon.display_order.asc(), PricingAddon.id.asc())
        .all()
    )

    return PublicPricingConfigResponse(
        services=services,
        complexity_factors=complexity_factors,
        platform_factors=platform_factors,
        addons=addons,
        dp_percent=40,
        rounding_unit=50000,
    )


# =====================================================================
# 1. ENDPOINT PUBLIK (KATALOG LAYANAN & KONFIGURASI KALKULATOR)
# =====================================================================

@router.get("/", response_model=List[ServiceCatalogResponse])
def list_public_services(db: Session = Depends(get_db)):
    """Mengambil daftar layanan yang aktif untuk ditampilkan di Landing Page."""
    if db.query(ServiceCatalog).count() == 0:
        seed_initial_pricing(db)

    return (
        db.query(ServiceCatalog)
        .filter(ServiceCatalog.is_active == True)
        .order_by(ServiceCatalog.display_order.asc(), ServiceCatalog.id.asc())
        .all()
    )


@router.get("/config", response_model=PublicPricingConfigResponse)
def get_public_pricing_config(db: Session = Depends(get_db)):
    """Mengambil seluruh konfigurasi layanan & kalkulator harga aktif dalam 1 request."""
    return build_public_pricing_config(db)


# =====================================================================
# 2. ENDPOINT ADMIN - CRUD KATALOG LAYANAN (M3.A)
# =====================================================================

@router.get("/admin/all", response_model=List[ServiceCatalogResponse])
def list_all_services_admin(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Mengambil seluruh layanan (termasuk yang nonaktif)."""
    if db.query(ServiceCatalog).count() == 0:
        seed_initial_pricing(db)

    return (
        db.query(ServiceCatalog)
        .order_by(ServiceCatalog.display_order.asc(), ServiceCatalog.id.asc())
        .all()
    )


@router.post("/", response_model=ServiceCatalogResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCatalogCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menambahkan layanan baru ke katalog & kalkulator."""
    clean_slug = data.slug.strip().lower().replace(" ", "_")
    exists = (
        db.query(ServiceCatalog)
        .filter(func.lower(ServiceCatalog.slug) == clean_slug)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=400,
            detail=f"Layanan dengan slug '{clean_slug}' sudah terdaftar.",
        )

    if data.base_price_min > data.base_price_max:
        raise HTTPException(
            status_code=400,
            detail="Harga dasar minimum tidak boleh lebih besar dari harga dasar maksimum.",
        )

    if not (data.min_days <= data.standard_days <= data.max_days):
        raise HTTPException(
            status_code=400,
            detail="Aturan durasi hari tidak valid: wajib memenuhi min_days <= standard_days <= max_days.",
        )

    svc = ServiceCatalog(
        slug=clean_slug,
        name=data.name.strip(),
        short_label=data.short_label.strip(),
        description=data.description.strip(),
        features=data.features,
        icon=data.icon.strip(),
        color=data.color.strip(),
        category=data.category,
        base_price_min=data.base_price_min,
        base_price_max=data.base_price_max,
        standard_days=data.standard_days,
        min_days=data.min_days,
        max_days=data.max_days,
        is_active=data.is_active,
        display_order=data.display_order,
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


@router.patch("/{service_id}", response_model=ServiceCatalogResponse)
def update_service(
    service_id: int,
    data: ServiceCatalogUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Mengubah detail, harga dasar, durasi, atau status aktif layanan."""
    svc = db.query(ServiceCatalog).filter(ServiceCatalog.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Layanan tidak ditemukan.")

    if data.slug is not None:
        clean_slug = data.slug.strip().lower().replace(" ", "_")
        conflict = (
            db.query(ServiceCatalog)
            .filter(
                func.lower(ServiceCatalog.slug) == clean_slug,
                ServiceCatalog.id != service_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Slug '{clean_slug}' sudah digunakan layanan lain.",
            )
        svc.slug = clean_slug

    if data.name is not None:
        svc.name = data.name.strip()
    if data.short_label is not None:
        svc.short_label = data.short_label.strip()
    if data.description is not None:
        svc.description = data.description.strip()
    if data.features is not None:
        svc.features = data.features
    if data.icon is not None:
        svc.icon = data.icon.strip()
    if data.color is not None:
        svc.color = data.color.strip()
    if data.category is not None:
        svc.category = data.category
    if data.base_price_min is not None:
        svc.base_price_min = data.base_price_min
    if data.base_price_max is not None:
        svc.base_price_max = data.base_price_max
    if data.standard_days is not None:
        svc.standard_days = data.standard_days
    if data.min_days is not None:
        svc.min_days = data.min_days
    if data.max_days is not None:
        svc.max_days = data.max_days
    if data.is_active is not None:
        svc.is_active = data.is_active
    if data.display_order is not None:
        svc.display_order = data.display_order

    if svc.base_price_min > svc.base_price_max:
        raise HTTPException(
            status_code=400,
            detail="Harga dasar minimum tidak boleh lebih besar dari harga dasar maksimum.",
        )

    if not (svc.min_days <= svc.standard_days <= svc.max_days):
        raise HTTPException(
            status_code=400,
            detail="Aturan durasi hari tidak valid: wajib memenuhi min_days <= standard_days <= max_days.",
        )

    db.commit()
    db.refresh(svc)
    return svc


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin: Menghapus layanan dari katalog.
    Aturan Bisnis M3 #2: Jika layanan sudah pernah dipakai oleh order, tolak penghapusan
    permanen (hard delete) dan arahkan untuk menonaktifkan (soft delete).
    """
    svc = db.query(ServiceCatalog).filter(ServiceCatalog.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Layanan tidak ditemukan.")

    order_count = (
        db.query(Order)
        .filter(func.lower(Order.service_type) == svc.slug.lower())
        .count()
    )
    if order_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Layanan '{svc.name}' sudah dipakai oleh {order_count} pesanan. "
                f"Nonaktifkan layanan saja agar data historis pesanan tetap aman."
            ),
        )

    db.delete(svc)
    db.commit()
    return {"message": f"Layanan '{svc.name}' berhasil dihapus."}


# =====================================================================
# 3. ENDPOINT ADMIN - CRUD FAKTOR PENGALI (M3.B)
# =====================================================================

@router.get("/factors/all", response_model=List[PricingFactorResponse])
def list_all_factors_admin(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Mengambil seluruh faktor pengali (complexity & platform)."""
    if db.query(PricingFactor).count() == 0:
        seed_initial_pricing(db)

    return (
        db.query(PricingFactor)
        .order_by(
            PricingFactor.factor_type.asc(),
            PricingFactor.display_order.asc(),
            PricingFactor.id.asc(),
        )
        .all()
    )


@router.post("/factors", response_model=PricingFactorResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_factor(
    data: PricingFactorCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menambahkan faktor pengali baru (kompleksitas atau platform)."""
    clean_code = data.code.strip().lower().replace(" ", "_")
    exists = (
        db.query(PricingFactor)
        .filter(
            PricingFactor.factor_type == data.factor_type,
            func.lower(PricingFactor.code) == clean_code,
        )
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=400,
            detail=f"Faktor '{clean_code}' untuk tipe '{data.factor_type}' sudah ada.",
        )

    if data.is_default:
        db.query(PricingFactor).filter(
            PricingFactor.factor_type == data.factor_type
        ).update({"is_default": False})

    factor = PricingFactor(
        factor_type=data.factor_type,
        code=clean_code,
        label=data.label.strip(),
        description=data.description.strip() if data.description else None,
        multiplier=data.multiplier,
        applicable_services=data.applicable_services,
        is_default=data.is_default,
        is_active=data.is_active,
        display_order=data.display_order,
    )
    db.add(factor)
    db.commit()
    db.refresh(factor)
    return factor


@router.patch("/factors/{factor_id}", response_model=PricingFactorResponse)
def update_pricing_factor(
    factor_id: int,
    data: PricingFactorUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Mengubah multiplier, label, atau status aktif faktor pengali."""
    factor = db.query(PricingFactor).filter(PricingFactor.id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Faktor pengali tidak ditemukan.")

    if data.factor_type is not None:
        factor.factor_type = data.factor_type
    if data.code is not None:
        factor.code = data.code.strip().lower().replace(" ", "_")
    if data.label is not None:
        factor.label = data.label.strip()
    if data.description is not None:
        factor.description = data.description.strip()
    if data.multiplier is not None:
        factor.multiplier = data.multiplier
    if "applicable_services" in data.model_fields_set:
        factor.applicable_services = data.applicable_services
    if data.is_active is not None:
        factor.is_active = data.is_active
    if data.display_order is not None:
        factor.display_order = data.display_order

    if data.is_default is True:
        db.query(PricingFactor).filter(
            PricingFactor.factor_type == factor.factor_type,
            PricingFactor.id != factor.id,
        ).update({"is_default": False})
        factor.is_default = True
    elif data.is_default is False:
        factor.is_default = False

    db.commit()
    db.refresh(factor)
    return factor


@router.delete("/factors/{factor_id}")
def delete_pricing_factor(
    factor_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menghapus faktor pengali (wajib menyisakan minimal 1 faktor aktif per tipe)."""
    factor = db.query(PricingFactor).filter(PricingFactor.id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Faktor pengali tidak ditemukan.")

    remaining_active = (
        db.query(PricingFactor)
        .filter(
            PricingFactor.factor_type == factor.factor_type,
            PricingFactor.is_active == True,
            PricingFactor.id != factor.id,
        )
        .count()
    )
    if remaining_active == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Tidak dapat menghapus: minimal harus ada 1 faktor '{factor.factor_type}' yang aktif.",
        )

    db.delete(factor)
    db.commit()
    return {"message": f"Faktor '{factor.label}' berhasil dihapus."}


# =====================================================================
# 4. ENDPOINT ADMIN - CRUD ADD-ONS / FASILITAS TAMBAHAN (M3.D)
# =====================================================================

@router.get("/addons/all", response_model=List[PricingAddonResponse])
def list_all_addons_admin(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Mengambil seluruh daftar add-on kalkulator."""
    if db.query(PricingAddon).count() == 0:
        seed_initial_pricing(db)

    return (
        db.query(PricingAddon)
        .order_by(PricingAddon.display_order.asc(), PricingAddon.id.asc())
        .all()
    )


@router.post("/addons", response_model=PricingAddonResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_addon(
    data: PricingAddonCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menambahkan add-on baru ke kalkulator harga."""
    clean_code = data.code.strip().lower().replace(" ", "_")
    exists = (
        db.query(PricingAddon)
        .filter(func.lower(PricingAddon.code) == clean_code)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=400,
            detail=f"Add-on dengan kode '{clean_code}' sudah terdaftar.",
        )

    if data.price_min > data.price_max:
        raise HTTPException(
            status_code=400,
            detail="Harga/persentase minimum add-on tidak boleh melebihi maksimum.",
        )

    addon = PricingAddon(
        code=clean_code,
        label=data.label.strip(),
        description=data.description.strip() if data.description else None,
        price_type=data.price_type,
        price_min=data.price_min,
        price_max=data.price_max,
        benefit_text=data.benefit_text.strip(),
        applicable_services=data.applicable_services,
        is_default_checked=data.is_default_checked,
        is_active=data.is_active,
        display_order=data.display_order,
    )
    db.add(addon)
    db.commit()
    db.refresh(addon)
    return addon


@router.patch("/addons/{addon_id}", response_model=PricingAddonResponse)
def update_pricing_addon(
    addon_id: int,
    data: PricingAddonUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Mengubah detail, harga, atau status aktif add-on."""
    addon = db.query(PricingAddon).filter(PricingAddon.id == addon_id).first()
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on tidak ditemukan.")

    if data.code is not None:
        clean_code = data.code.strip().lower().replace(" ", "_")
        conflict = (
            db.query(PricingAddon)
            .filter(
                func.lower(PricingAddon.code) == clean_code,
                PricingAddon.id != addon_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Kode add-on '{clean_code}' sudah digunakan.",
            )
        addon.code = clean_code

    if data.label is not None:
        addon.label = data.label.strip()
    if data.description is not None:
        addon.description = data.description.strip()
    if data.price_type is not None:
        addon.price_type = data.price_type
    if data.price_min is not None:
        addon.price_min = data.price_min
    if data.price_max is not None:
        addon.price_max = data.price_max
    if data.benefit_text is not None:
        addon.benefit_text = data.benefit_text.strip()
    if "applicable_services" in data.model_fields_set:
        addon.applicable_services = data.applicable_services
    if data.is_default_checked is not None:
        addon.is_default_checked = data.is_default_checked
    if data.is_active is not None:
        addon.is_active = data.is_active
    if data.display_order is not None:
        addon.display_order = data.display_order

    if addon.price_min > addon.price_max:
        raise HTTPException(
            status_code=400,
            detail="Harga/persentase minimum add-on tidak boleh melebihi maksimum.",
        )

    db.commit()
    db.refresh(addon)
    return addon


@router.delete("/addons/{addon_id}")
def delete_pricing_addon(
    addon_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menghapus add-on dari kalkulator."""
    addon = db.query(PricingAddon).filter(PricingAddon.id == addon_id).first()
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on tidak ditemukan.")

    db.delete(addon)
    db.commit()
    return {"message": f"Add-on '{addon.label}' berhasil dihapus."}
