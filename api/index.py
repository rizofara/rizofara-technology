import sys
import os
import traceback
from pathlib import Path

# Dapatkan path direktori
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Tandai environment Vercel
os.environ["VERCEL"] = "1"

try:
    from app.main import app
    from app.api.v1.api import api_router

    # Daftarkan router dengan prefix /v1 dan /api/v1 agar kebal dari pemotongan prefix Vercel
    app.include_router(api_router, prefix="/v1")

    # Health check endpoint
    @app.get("/api")
    @app.get("/api/")
    def vercel_api_health():
        return {
            "status": "online",
            "service": "Rizofara Technology Serverless Backend",
            "environment": "Vercel + Supabase",
        }

except Exception as e:
    err_trace = traceback.format_exc()
    print("FATAL VERCEL STARTUP ERROR:", err_trace)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Rizofara Error Fallback")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def vercel_error_handler(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"FastAPI Serverless Startup Error: {str(e)}",
                "traceback": err_trace.splitlines(),
            },
        )
