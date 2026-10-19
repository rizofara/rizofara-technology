import os
import uuid
from typing import Tuple, Set
from fastapi import UploadFile, HTTPException
from app.core.config import settings

# Daftar ekstensi file dokumen klien yang diizinkan (Whitelist)
ALLOWED_DOC_EXTENSIONS: Set[str] = {
    ".pdf", ".doc", ".docx", ".ppt", ".pptx",
    ".xls", ".xlsx", ".zip", ".rar", ".txt",
    ".png", ".jpg", ".jpeg", ".webp"
}

# Daftar ekstensi gambar publik (Portofolio, Avatar, Logo)
ALLOWED_IMAGE_EXTENSIONS: Set[str] = {
    ".png", ".jpg", ".jpeg", ".webp"
}

# Daftar ekstensi berbahaya yang selalu ditolak keras
BLOCKED_EXTENSIONS: Set[str] = {
    ".exe", ".bat", ".cmd", ".sh", ".ps1", ".php",
    ".js", ".html", ".htm", ".vbs", ".dll", ".msi"
}


def validate_and_get_extension(filename: str, allowed_extensions: Set[str]) -> str:
    """
    Memvalidasi nama file dan memastikan ekstensinya masuk dalam daftar whitelist.
    Mencegah serangan double-extension atau upload script berbahaya.
    """
    if not filename or "." not in filename:
        raise HTTPException(
            status_code=400,
            detail="Nama file tidak valid atau tidak memiliki ekstensi."
        )

    ext = os.path.splitext(filename)[1].lower().strip()
    if ext in BLOCKED_EXTENSIONS or ext not in allowed_extensions:
        allowed_str = ", ".join(sorted(allowed_extensions))
        raise HTTPException(
            status_code=400,
            detail=f"Tipe file '{ext}' tidak diizinkan. Format yang didukung: {allowed_str}"
        )
    return ext


async def save_private_order_file(
    file: UploadFile,
    order_code: str,
    category: str = "brief"
) -> Tuple[str, str, int]:
    """
    Menyimpan berkas milik order (panduan tugas/skripsi atau deliverable)
    ke dalam direktori PRIVAT agar tidak bisa diakses publik tanpa izin (Perbaikan S-03 & S-04).

    Returns:
        Tuple[original_filename, dest_path, file_size_bytes]
    """
    ext = validate_and_get_extension(file.filename or "", ALLOWED_DOC_EXTENSIONS)

    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File yang diunggah kosong (0 byte).")

    if file_size > settings.MAX_DOC_UPLOAD_SIZE:
        max_mb = settings.MAX_DOC_UPLOAD_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran file terlalu besar. Maksimal ukuran file adalah {max_mb} MB."
        )

    # Gunakan UUID acak agar nama file di disk tidak bisa ditebak
    safe_stored_name = f"{order_code}_{category}_{uuid.uuid4().hex[:10]}{ext}"
    dest_path = os.path.join(settings.PRIVATE_ORDERS_DIR, safe_stored_name)

    with open(dest_path, "wb") as f:
        f.write(content)

    return (file.filename or safe_stored_name, dest_path, file_size)


async def save_public_media_file(
    file: UploadFile,
    prefix: str = "media"
) -> Tuple[str, str, int]:
    """
    Menyimpan gambar publik (seperti thumbnail portofolio atau foto profil)
    ke folder storage/public/media yang dapat diakses melalui URL /media/...
    """
    ext = validate_and_get_extension(file.filename or "", ALLOWED_IMAGE_EXTENSIONS)

    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File gambar kosong.")

    if file_size > settings.MAX_IMAGE_UPLOAD_SIZE:
        max_mb = settings.MAX_IMAGE_UPLOAD_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran gambar terlalu besar. Maksimal {max_mb} MB."
        )

    safe_stored_name = f"{prefix}_{uuid.uuid4().hex[:10]}{ext}"
    dest_path = os.path.join(settings.PUBLIC_MEDIA_DIR, safe_stored_name)

    with open(dest_path, "wb") as f:
        f.write(content)

    public_url = f"/media/{safe_stored_name}"
    return (public_url, dest_path, file_size)
