from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session

from app.schemas.order import (
    CalculatorRequest,
    CalculatorResponse,
    CalculatorBreakdownItem,
)
from app.models.pricing import ServiceCatalog, PricingFactor, PricingAddon
from app.seed import seed_initial_pricing

# Konfigurasi cadangan (fallback) jika fungsi dipanggil tanpa sesi database
DEFAULT_SERVICES: Dict[str, Dict[str, Any]] = {
    "tugas": {
        "name": "Tugas Kuliah Pemrograman",
        "min": 100_000,
        "max": 350_000,
        "standard_days": 3,
        "min_days": 1,
    },
    "skripsi": {
        "name": "Program Skripsi & Tugas Akhir",
        "min": 1_800_000,
        "max": 3_500_000,
        "standard_days": 21,
        "min_days": 5,
    },
    "website": {
        "name": "Jasa Pembuatan Website",
        "min": 1_200_000,
        "max": 3_800_000,
        "standard_days": 14,
        "min_days": 5,
    },
    "chatbot": {
        "name": "Jasa Pembuatan Chatbot",
        "min": 900_000,
        "max": 2_800_000,
        "standard_days": 10,
        "min_days": 5,
    },
}

COMPLEXITY_FACTORS: Dict[str, Dict[str, Any]] = {
    "basic": {"label": "Dasar (CRUD)", "multiplier": 1.00},
    "intermediate": {"label": "Menengah", "multiplier": 1.30},
    "advanced": {"label": "Lanjutan (AI/API)", "multiplier": 1.70},
    "expert": {"label": "Kompleks / Riset", "multiplier": 2.20},
}

PLATFORM_FACTORS: Dict[str, Dict[str, Any]] = {
    "web": {"label": "Web", "multiplier": 1.00},
    "mobile": {"label": "Mobile (Flutter)", "multiplier": 1.35},
    "ai_ml": {"label": "AI / ML / Data", "multiplier": 1.45},
    "iot": {"label": "IoT", "multiplier": 1.40},
    "desktop": {"label": "Desktop", "multiplier": 1.15},
}


def round_half_up_to_unit(amount: float, unit: int = 50_000) -> int:
    """
    Membulatkan nominal Rupiah ke kelipatan `unit` terdekat menggunakan aturan
    ROUND_HALF_UP (0.5 selalu dibulatkan ke atas), sehingga 100% identik dengan
    fungsi Math.round() di JavaScript (Frontend).
    """
    if unit <= 0:
        return int(amount)
    divided = Decimal(str(amount)) / Decimal(str(unit))
    rounded_units = int(divided.quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    return rounded_units * unit


def resolve_urgency_tier(days: int, standard_days: int) -> Tuple[str, float]:
    """
    Menentukan tier urgensi dan multiplier berdasarkan rasio:
        rasio = hari_dipilih / standard_days_layanan
    """
    ratio = days / max(standard_days, 1)
    if ratio < 0.35:
        return ("Kilat", 1.35)
    elif ratio < 0.65:
        return ("Cepat", 1.20)
    elif ratio < 1.00:
        return ("Standar", 1.10)
    else:
        return ("Santai", 1.00)


def _resolve_selected_addon_codes(data: CalculatorRequest) -> List[str]:
    """
    Menentukan daftar kode add-on yang dipilih klien:
    - Jika `selected_addons` dikirim secara eksplisit (array dinamis), gunakan array tersebut.
    - Jika `selected_addons` bernilai None, gunakan flag boolean `include_report` & `include_wireframe`
      agar kompatibel penuh dengan request versi sebelumnya.
    """
    if data.selected_addons is not None:
        return [code.lower().strip() for code in data.selected_addons if code]

    codes: List[str] = []
    if data.include_report:
        codes.append("report")
    if data.include_wireframe:
        codes.append("wireframe")
    return codes


def calculate_price(
    data: CalculatorRequest, db: Optional[Session] = None
) -> CalculatorResponse:
    """
    Satu-satunya sumber kebenaran (Single Source of Truth) untuk menghitung
    estimasi biaya layanan dan DP.
    Jika `db` diberikan, konfigurasi layanan, faktor pengali, dan add-on diambil
    langsung secara dinamis dari database (Modul M3 & M4).
    """
    req_service_key = data.service_type.lower().strip()
    req_comp_key = data.complexity.lower().strip()
    req_plat_key = (data.tech_platform or "web").lower().strip()
    selected_addon_codes = _resolve_selected_addon_codes(data)

    # --- MODE DINAMIS DATABASE (M3 & M4) ---
    if db is not None:
        if db.query(ServiceCatalog).count() == 0:
            seed_initial_pricing(db)

        svc_obj = (
            db.query(ServiceCatalog)
            .filter(ServiceCatalog.slug == req_service_key, ServiceCatalog.is_active == True)
            .first()
        )
        if not svc_obj:
            svc_obj = (
                db.query(ServiceCatalog)
                .filter(ServiceCatalog.slug == "skripsi")
                .first()
                or db.query(ServiceCatalog).first()
            )

        service_key = svc_obj.slug
        service_name = svc_obj.name
        base_min = svc_obj.base_price_min
        base_max = svc_obj.base_price_max
        standard_days = svc_obj.standard_days
        min_days = svc_obj.min_days

        comp_obj = (
            db.query(PricingFactor)
            .filter(
                PricingFactor.factor_type == "complexity",
                PricingFactor.code == req_comp_key,
                PricingFactor.is_active == True,
            )
            .first()
        )
        if not comp_obj:
            comp_obj = (
                db.query(PricingFactor)
                .filter(PricingFactor.factor_type == "complexity", PricingFactor.is_default == True)
                .first()
                or db.query(PricingFactor)
                .filter(PricingFactor.factor_type == "complexity")
                .first()
            )
        comp_label = comp_obj.label if comp_obj else "Menengah"
        comp_mult = float(comp_obj.multiplier) if comp_obj else 1.30

        plat_obj = (
            db.query(PricingFactor)
            .filter(
                PricingFactor.factor_type == "platform",
                PricingFactor.code == req_plat_key,
                PricingFactor.is_active == True,
            )
            .first()
        )
        if not plat_obj:
            plat_obj = (
                db.query(PricingFactor)
                .filter(PricingFactor.factor_type == "platform", PricingFactor.is_default == True)
                .first()
                or db.query(PricingFactor)
                .filter(PricingFactor.factor_type == "platform")
                .first()
            )
        plat_label = plat_obj.label if plat_obj else "Web"
        plat_mult = float(plat_obj.multiplier) if plat_obj else 1.00

    # --- MODE FALLBACK TANPA DB ---
    else:
        service = DEFAULT_SERVICES.get(req_service_key, DEFAULT_SERVICES["skripsi"])
        service_key = req_service_key if req_service_key in DEFAULT_SERVICES else "skripsi"
        service_name = service["name"]
        base_min = service["min"]
        base_max = service["max"]
        standard_days = service["standard_days"]
        min_days = service["min_days"]

        comp_info = COMPLEXITY_FACTORS.get(req_comp_key, COMPLEXITY_FACTORS["intermediate"])
        comp_label = comp_info["label"]
        comp_mult = comp_info["multiplier"]

        plat_info = PLATFORM_FACTORS.get(req_plat_key, PLATFORM_FACTORS["web"])
        plat_label = plat_info["label"]
        plat_mult = plat_info["multiplier"]

    urgency_label, urgency_mult = resolve_urgency_tier(data.urgency_days, standard_days)
    is_feasible = data.urgency_days >= min_days

    breakdown: List[CalculatorBreakdownItem] = [
        CalculatorBreakdownItem(
            step="base",
            label=f"Harga Dasar ({service_name})",
            amount_min=base_min,
            amount_max=base_max,
        ),
        CalculatorBreakdownItem(
            step="complexity",
            label=f"Tingkat Kompleksitas: {comp_label}",
            multiplier=comp_mult,
        ),
        CalculatorBreakdownItem(
            step="platform",
            label=f"Platform: {plat_label}",
            multiplier=plat_mult,
        ),
        CalculatorBreakdownItem(
            step="urgency",
            label=f"Target Waktu: {data.urgency_days} Hari ({urgency_label})",
            multiplier=urgency_mult,
        ),
    ]

    # Langkah 1: Hitung subtotal dengan faktor pengali
    total_mult = comp_mult * plat_mult * urgency_mult
    subtotal_min = float(base_min) * total_mult
    subtotal_max = float(base_max) * total_mult
    min_price = subtotal_min
    max_price = subtotal_max

    # Langkah 2: Fasilitas tambahan (Add-ons) & daftar benefit yang konsisten
    benefits = [
        "Full Source Code 100% Hak Milik",
        "Garansi Revisi Tanpa Biaya Tambahan (Sesuai Scope Awal)",
        "Video Panduan / Readme Cara Menjalankan Program",
    ]

    if db is not None:
        active_addons = (
            db.query(PricingAddon)
            .filter(PricingAddon.is_active == True)
            .order_by(PricingAddon.display_order.asc(), PricingAddon.id.asc())
            .all()
        )
        for addon in active_addons:
            if addon.code.lower() not in selected_addon_codes:
                continue
            # Cek apakah add-on dibatasi hanya untuk layanan tertentu
            if addon.applicable_services and len(addon.applicable_services) > 0:
                allowed_slugs = [s.lower() for s in addon.applicable_services]
                if service_key.lower() not in allowed_slugs:
                    continue

            if addon.price_type == "percent":
                add_min = int(round_half_up_to_unit(subtotal_min * (addon.price_min / 100.0), 1))
                add_max = int(round_half_up_to_unit(subtotal_max * (addon.price_max / 100.0), 1))
            else:
                add_min = int(addon.price_min)
                add_max = int(addon.price_max)

            min_price += add_min
            max_price += add_max
            benefits.append(addon.benefit_text)
            breakdown.append(
                CalculatorBreakdownItem(
                    step="addon",
                    label=f"Add-on: {addon.label}",
                    amount_min=add_min,
                    amount_max=add_max,
                )
            )
    else:
        report_applicable = service_key in ["skripsi", "tugas"]
        if "report" in selected_addon_codes and report_applicable:
            min_price += 200_000
            max_price += 400_000
            benefits.append("Bantuan Penyusunan Laporan / Pembahasan Algoritma & Flowchart")
            breakdown.append(
                CalculatorBreakdownItem(
                    step="addon",
                    label="Add-on: Bantuan Laporan / Pembahasan Program",
                    amount_min=200_000,
                    amount_max=400_000,
                )
            )

        if "wireframe" in selected_addon_codes:
            min_price += 100_000
            max_price += 250_000
            benefits.append("Desain Wireframe UI/UX dengan Balsamiq Mockups")
            breakdown.append(
                CalculatorBreakdownItem(
                    step="addon",
                    label="Add-on: Desain Wireframe UI/UX (Balsamiq)",
                    amount_min=100_000,
                    amount_max=250_000,
                )
            )

    # Langkah 3: Pembulatan ke kelipatan Rp 50.000 terdekat (Half-Up)
    rounded_min = round_half_up_to_unit(min_price, 50_000)
    rounded_max = round_half_up_to_unit(max_price, 50_000)
    recommended_dp = round_half_up_to_unit(rounded_min * 0.40, 50_000)

    if not is_feasible:
        notes = (
            f"Waktu pengerjaan {data.urgency_days} hari berada di bawah batas minimum "
            f"({min_days} hari) untuk layanan {service_name}. "
            f"Silakan konsultasikan langsung via WhatsApp untuk ketersediaan tim."
        )
    else:
        notes = (
            "Estimasi ini bersifat indikatif. Harga final dapat dinegosiasikan setelah diskusi "
            "kebutuhan spesifik via WhatsApp."
        )

    return CalculatorResponse(
        service_type=service_key,
        service_name=service_name,
        estimated_min_price=rounded_min,
        estimated_max_price=rounded_max,
        recommended_dp=recommended_dp,
        estimated_days=data.urgency_days,
        urgency_tier=urgency_label,
        is_feasible=is_feasible,
        min_allowed_days=min_days,
        breakdown=breakdown,
        benefits=benefits,
        notes=notes,
    )
