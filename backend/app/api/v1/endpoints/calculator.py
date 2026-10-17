from fastapi import APIRouter
from app.schemas.order import CalculatorRequest, CalculatorResponse

router = APIRouter()

BASE_PRICES = {
    "tugas": {"min": 100_000, "max": 350_000, "days": 3},
    "skripsi": {"min": 1_800_000, "max": 3_500_000, "days": 21},
    "website": {"min": 1_200_000, "max": 3_800_000, "days": 14},
    "chatbot": {"min": 900_000, "max": 2_800_000, "days": 10},
}

COMPLEXITY_MULTIPLIER = {
    "basic": 1.0,
    "intermediate": 1.3,
    "advanced": 1.7,
    "expert": 2.2,
}

PLATFORM_MULTIPLIER = {
    "web": 1.0,
    "mobile": 1.35,
    "ai_ml": 1.45,
    "iot": 1.40,
    "desktop": 1.15,
}

@router.post("/estimate", response_model=CalculatorResponse)
def calculate_price_estimate(data: CalculatorRequest):
    service = data.service_type.lower()
    base = BASE_PRICES.get(service, BASE_PRICES["skripsi"])
    
    comp_mult = COMPLEXITY_MULTIPLIER.get(data.complexity.lower(), 1.2)
    plat_mult = PLATFORM_MULTIPLIER.get((data.tech_platform or "web").lower(), 1.0)
    
    # Faktor urgensi deadline (minimal 5 hari)
    urgency_mult = 1.0
    if data.urgency_days <= 6:
        urgency_mult = 1.35  # Kilat (5-6 hari)
    elif data.urgency_days <= 10:
        urgency_mult = 1.20  # Cepat (7-10 hari)
    elif data.urgency_days <= 14:
        urgency_mult = 1.10  # Standar
        
    min_price = int(base["min"] * comp_mult * plat_mult * urgency_mult)
    max_price = int(base["max"] * comp_mult * plat_mult * urgency_mult)

    # Tambahan add-ons
    if data.include_report and service in ["skripsi", "tugas"]:
        min_price += 200_000
        max_price += 400_000

    if data.include_wireframe:
        min_price += 100_000
        max_price += 250_000

    # Bulatkan ke kelipatan 50.000 terdekat
    min_price = round(min_price / 50_000) * 50_000
    max_price = round(max_price / 50_000) * 50_000
    recommended_dp = int(round((min_price * 0.4) / 50_000) * 50_000)

    benefits = [
        "Full Source Code 100% Hak Milik",
        "Garansi Revisi Tanpa Biaya Tambahan (Sesuai Scope Awal)",
        "Video Panduan / Readme Cara Menjalankan Program",
    ]
    if data.include_report:
        benefits.append("Bantuan Penyusunan Laporan / Pembahasan Algoritma & Flowchart")
    if data.include_wireframe:
        benefits.append("Desain Wireframe UI/UX dengan Balsamiq Mockups")

    notes = (
        "Estimasi ini bersifat indikatif. Harga final dapat dinegosiasikan setelah diskusi "
        "kebutuhan spesifik via WhatsApp."
    )

    return CalculatorResponse(
        service_type=data.service_type,
        estimated_min_price=min_price,
        estimated_max_price=max_price,
        recommended_dp=recommended_dp,
        estimated_days=data.urgency_days,
        benefits=benefits,
        notes=notes
    )
