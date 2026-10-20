"""
api/index.py - Vercel Python Serverless Function Entrypoint

File ini adalah endpoint Python yang dideteksi oleh Vercel secara otomatis
karena berada di folder api/ di root project.
"""
import sys
import os
from pathlib import Path

# =============================================
# 1. Setup sys.path agar bisa import dari backend/
# =============================================
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ.setdefault("VERCEL", "1")

# =============================================
# 2. Import FastAPI app dari backend
# =============================================
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Buat app dasar dulu, agar Vercel bisa detect module ini
app = FastAPI(title="Rizofara API")

# Health check sederhana - untuk verifikasi Python function berjalan
@app.get("/api/ping")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Python serverless function is running!"}

# =============================================
# 3. Load backend routes
# =============================================
try:
    from app.core.config import settings
    from app.db.base import Base
    from app.db.session import engine
    from app.api.v1.api import api_router
    from app.seed import run_startup_seed

    # Buat tabel jika belum ada
    Base.metadata.create_all(bind=engine)
    run_startup_seed()

    # Mount semua endpoint /api/v1/*
    app.include_router(api_router, prefix="/api/v1")

    print("Backend routes loaded successfully")

except Exception as e:
    import traceback
    err = traceback.format_exc()
    print(f"Backend load error: {e}\n{err}")

    # Fallback: tambahkan endpoint error reporter
    @app.api_route(
        "/api/v1/{full_path:path}",
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    )
    async def backend_error(full_path: str):
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "hint": "Backend failed to load"}
        )
