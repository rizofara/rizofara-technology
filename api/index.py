import sys
import os
from pathlib import Path

# Dapatkan path root repository
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

# Pastikan backend dan root ada di PYTHONPATH
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Import instance FastAPI utama dari backend
from app.main import app

# Handler untuk Vercel Serverless
# Vercel mendeteksi variable 'app' secara otomatis sebagai ASGI Application
