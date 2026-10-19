import datetime
from typing import Optional, Dict, Any
import bcrypt
import jwt
from fastapi import HTTPException, status
from app.core.config import settings


def hash_password(plain_password: str) -> str:
    """
    Mengubah password teks biasa menjadi hash bcrypt yang aman (one-way hashing dengan salt).
    Password asli tidak pernah disimpan di database.
    """
    pwd_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Memverifikasi apakah password yang diketik user cocok dengan hash bcrypt di database.
    Menggunakan perbandingan waktu konstan (constant-time comparison) untuk mencegah timing attack.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(
    subject: int | str,
    role: str,
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """
    Membuat JSON Web Token (JWT) bertanda tangan digital (HS256).
    Payload berisi:
    - sub: ID Admin
    - role: Peran Admin ('superadmin' atau 'admin')
    - iat: Waktu token diterbitkan
    - exp: Waktu token kedaluwarsa
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": now,
        "exp": expire,
    }
    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Memverifikasi keaslian dan masa berlaku token JWT.
    Jika token palsu atau sudah kedaluwarsa, lempar HTTP 401 Unauthorized.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi login telah berakhir. Silakan login kembali.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak valid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
