from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security_middleware import SecurityHeadersMiddleware, RateLimitMiddleware
from app.db.base import Base
from app.db.session import engine, get_db
from app.models.showcase import PortfolioItem
from app.api.v1.api import api_router
from app.seed import run_startup_seed

# Otomatis buat tabel database jika belum ada & seed data awal (aman untuk Serverless Vercel)
try:
    Base.metadata.create_all(bind=engine)
    run_startup_seed()
except Exception as e:
    print(f"Notice: Startup DB creation/seeder skipped on serverless: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API Platform Jasa Asistensi Skripsi, Tugas Kuliah, Web Development, dan AI Chatbot",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Setup Middleware Keamanan & Rate Limiting (Fase 6 - PRD §11)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount HANYA folder media publik (portofolio, avatar, logo) - Perbaikan S-03
# Berkas tugas/skripsi klien disimpan di storage/private dan TIDAK diekspos di URL publik.
if Path(settings.PUBLIC_MEDIA_DIR).exists():
    app.mount("/media", StaticFiles(directory=settings.PUBLIC_MEDIA_DIR), name="media")

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


# --- ENDPOINT SEO PUBLIK: ROBOTS.TXT & SITEMAP.XML (Fase 6 - PRD §11) ---
@app.get("/robots.txt", response_class=PlainTextResponse, include_in_schema=False)
def get_robots_txt(request: Request):
    base_url = str(request.base_url).rstrip("/")
    content = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /api/\n"
        "Disallow: /admin\n"
        f"Sitemap: {base_url}/sitemap.xml\n"
    )
    return PlainTextResponse(content=content, media_type="text/plain")


@app.get("/sitemap.xml", include_in_schema=False)
def get_sitemap_xml(request: Request, db: Session = Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    published_portfolios = (
        db.query(PortfolioItem)
        .filter(PortfolioItem.is_published == True, PortfolioItem.client_consent == True)
        .order_by(PortfolioItem.display_order.asc())
        .all()
    )

    urls = [
        f"  <url><loc>{base_url}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>",
    ]
    for p in published_portfolios:
        urls.append(
            f"  <url><loc>{base_url}/?portfolio={p.slug}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>"
        )

    xml_body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    return Response(content=xml_body, media_type="application/xml")


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


