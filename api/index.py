import sys
import os
import traceback
from pathlib import Path

# ========================================
# Vercel Python Serverless Entrypoint
# File ini adalah gerbang masuk utama untuk
# semua request /api/* di Vercel.
# ========================================

# Tambahkan direktori backend ke sys.path
# agar Python bisa menemukan modul app.*
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Tandai bahwa kita berjalan di environment Vercel
# Ini digunakan di config.py untuk menyesuaikan
# lokasi folder storage (/tmp alih-alih path lokal)
os.environ.setdefault("VERCEL", "1")

try:
    # Import app FastAPI dari backend
    # Ini sudah mengandung: database setup, CORS,
    # semua router /api/v1/*, middleware, dsb.
    from app.main import app  # noqa: F401  <-- Vercel membaca variabel `app` ini

except Exception as e:
    err_trace = traceback.format_exc()
    print("FATAL VERCEL STARTUP ERROR:", err_trace)

    # Fallback: buat app minimal yang melaporkan error
    # agar kita bisa debug tanpa harus cek Vercel logs manual
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Rizofara - Startup Error")

    @app.api_route(
        "/{full_path:path}",
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    )
    async def vercel_error_handler(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "FastAPI Serverless Startup Error",
                "detail": str(e),
                "traceback": err_trace.splitlines(),
            },
        )
