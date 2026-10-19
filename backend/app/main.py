from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1.api import api_router
from app.seed import run_startup_seed

# Otomatis buat tabel database jika belum ada & seed data awal
Base.metadata.create_all(bind=engine)
run_startup_seed()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API Platform Jasa Asistensi Skripsi, Tugas Kuliah, Web Development, dan AI Chatbot",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount HANYA folder media publik (portofolio, avatar, logo) — Perbaikan S-03
# Berkas tugas/skripsi klien disimpan di storage/private dan TIDAK diekspos di URL publik.
app.mount("/media", StaticFiles(directory=settings.PUBLIC_MEDIA_DIR), name="media")

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# --- SATUKAN FRONTEND REACT LANGSUNG KE FASTAPI ---
FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Jika path mengarah ke API/media/uploads yang tidak ada, kembalikan 404 (Perbaikan B-12)
        if (
            full_path.startswith("api/")
            or full_path.startswith("docs")
            or full_path.startswith("openapi.json")
            or full_path.startswith("media/")
            or full_path.startswith("uploads/")
        ):
            raise HTTPException(status_code=404, detail="Endpoint atau berkas tidak ditemukan")

        file_path = FRONTEND_DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "status": "online",
            "project": settings.PROJECT_NAME,
            "version": "2.0.0",
            "message": "Frontend belum di-build. Akses API Docs di /docs",
            "docs_url": "/docs",
        }

