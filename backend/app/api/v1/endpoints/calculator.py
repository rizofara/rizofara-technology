from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.order import CalculatorRequest, CalculatorResponse
from app.schemas.pricing import PublicPricingConfigResponse
from app.services.pricing_engine import calculate_price
from app.api.v1.endpoints.services import build_public_pricing_config

router = APIRouter()


@router.get("/config", response_model=PublicPricingConfigResponse)
def get_calculator_config(db: Session = Depends(get_db)):
    """
    Mengambil daftar layanan, faktor kompleksitas, faktor platform, dan add-on
    aktif secara dinamis dari database untuk kalkulator frontend.
    """
    return build_public_pricing_config(db)


@router.post("/estimate", response_model=CalculatorResponse)
def calculate_price_estimate(
    data: CalculatorRequest,
    db: Session = Depends(get_db),
):
    """
    Menghitung estimasi biaya beserta rincian breakdown secara dinamis dari database
    menggunakan Pricing Engine (Single Source of Truth).
    """
    return calculate_price(data, db=db)
