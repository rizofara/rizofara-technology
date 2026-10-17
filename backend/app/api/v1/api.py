from fastapi import APIRouter
from app.api.v1.endpoints import calculator, orders, contact

api_router = APIRouter()

api_router.include_router(calculator.router, prefix="/calculator", tags=["Price Calculator"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Tracking"])
api_router.include_router(contact.router, prefix="/contact", tags=["Contact & WhatsApp"])
