import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

from app.core.config import settings
from app.db.session import engine

BACKUP_DIR = Path(settings.STORAGE_DIR) / "backups"
os.makedirs(BACKUP_DIR, exist_ok=True)


def _resolve_sqlite_db_path() -> Path | None:
    """
    Mengekstrak path fisik file SQLite dari konfigurasi engine/settings.
    Jika menggunakan in-memory SQLite (:memory:), mengembalikan None.
    """
    db_file = engine.url.database
    if not db_file or db_file == ":memory:":
        return None
    path = Path(db_file)
    if not path.is_absolute():
        path = (Path(settings.STORAGE_DIR).parent / path).resolve()
    return path


def create_database_backup(max_keep: int = 14) -> Dict[str, Any]:
    """
    Membuat hot-backup database SQLite ke folder `storage/backups/` menggunakan
    API `sqlite3.Connection.backup` (aman meskipun database sedang aktif diakses),
    lalu menerapkan kebijakan retensi otomatis maksimal `max_keep` (default 14 file, PRD §11).
    """
    os.makedirs(BACKUP_DIR, exist_ok=True)
    now = datetime.now(timezone.utc)
    timestamp = now.strftime("%Y%m%d_%H%M%S_%f")
    filename = f"rizofara_backup_{timestamp}.sqlite3"
    dest_path = BACKUP_DIR / filename

    src_path = _resolve_sqlite_db_path()
    if src_path and src_path.exists():
        with sqlite3.connect(str(src_path)) as src_conn:
            with sqlite3.connect(str(dest_path)) as dst_conn:
                src_conn.backup(dst_conn)
    else:
        # Fallback jika dijalankan pada in-memory SQLite saat pengujian unit test
        raw_conn = engine.raw_connection()
        try:
            with sqlite3.connect(str(dest_path)) as dst_conn:
                raw_conn.backup(dst_conn)
        finally:
            raw_conn.close()

    # Terapkan rotasi otomatis (simpan maksimal `max_keep` backup terbaru)
    all_backups = sorted(
        BACKUP_DIR.glob("rizofara_backup_*.sqlite3"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    for old_file in all_backups[max_keep:]:
        try:
            old_file.unlink()
        except OSError:
            pass

    remaining = list_database_backups()
    stat = dest_path.stat()
    return {
        "filename": filename,
        "size_bytes": stat.st_size,
        "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        "total_backups": len(remaining),
    }


def list_database_backups() -> List[Dict[str, Any]]:
    """
    Mengembalikan daftar file snapshot backup yang tersimpan di `storage/backups/`
    diurutkan dari yang paling baru.
    """
    os.makedirs(BACKUP_DIR, exist_ok=True)
    files = sorted(
        BACKUP_DIR.glob("rizofara_backup_*.sqlite3"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    result = []
    for f in files:
        st = f.stat()
        result.append(
            {
                "filename": f.name,
                "size_bytes": st.st_size,
                "created_at": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
            }
        )
    return result
