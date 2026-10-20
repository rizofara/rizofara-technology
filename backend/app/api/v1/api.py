from fastapi import APIRouter
from app.api.v1.endpoints import auth, services, calculator, orders, contact, showcase, cms, roles

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Admin Auth & Profile"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles & Permissions (CRUD)"])
api_router.include_router(services.router, prefix="/services", tags=["Services, Factors & Add-ons (CRUD)"])
api_router.include_router(calculator.router, prefix="/calculator", tags=["Price Calculator"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Tracking"])
api_router.include_router(showcase.router, prefix="/showcase", tags=["Portfolio & Testimonials (CRUD)"])
api_router.include_router(cms.router, prefix="/cms", tags=["CMS Settings, FAQ, TechStack & Dashboard"])
api_router.include_router(contact.router, prefix="/contact", tags=["Contact & WhatsApp"])
