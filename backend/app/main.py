import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1.api import api_router

# Otomatis buat tabel database jika belum ada
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API Platform Jasa Asistensi Skripsi, Tugas Kuliah, Web Development, dan AI Chatbot",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount folder static uploads (file tugas/skripsi klien)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# --- SATUKAN FRONTEND REACT LANGSUNG KE FASTAPI ---
# Path ke folder hasil build frontend (dist)
FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST_DIR.exists():
    # Mount asset statis frontend (css, js, images)
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Sajikan index.html di root dan semua route halaman
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Kecualikan path API, docs, atau uploads
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("uploads/"):
            return None
        file_path = FRONTEND_DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "status": "online",
            "message": "Frontend belum di-build. Akses API Docs di /docs",
            "docs_url": "/docs"
        }
