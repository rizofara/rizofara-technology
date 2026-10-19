import time
from collections import defaultdict, deque
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware Fase 6 (PRD §11):
    Menambahkan HTTP Security Headers standar produksi pada setiap response
    untuk mencegah MIME-sniffing, Clickjacking, dan kebocoran Referrer.
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


class SlidingWindowRateLimiter:
    """
    Rate limiter berbasis memori (Sliding Window) untuk melindungi endpoint sensitif
    seperti login admin, pelacakan order publik, dan pembuatan order dari brute-force/spam.
    """

    def __init__(self):
        # Menyimpan antrean timestamp per kunci (ip, bucket)
        self._hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)

    def reset(self) -> None:
        self._hits.clear()

    def is_allowed(self, client_ip: str, bucket: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        key = (client_ip, bucket)
        q = self._hits[key]

        # Bersihkan timestamp yang sudah lewat dari jendela waktu
        while q and (now - q[0]) > window_seconds:
            q.popleft()

        if len(q) >= max_requests:
            retry_after = max(1, int(window_seconds - (now - q[0])))
            return False, retry_after

        q.append(now)
        return True, 0


rate_limiter = SlidingWindowRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Menerapkan batas request per menit pada endpoint publik/autentikasi yang sensitif:
    - POST /api/v1/auth/login -> maks 10 percobaan / 60 detik per IP
    - GET  /api/v1/orders/track -> maks 30 request / 60 detik per IP
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method.upper()
        client_ip = request.client.host if request.client else "127.0.0.1"

        # Header opsional khusus pengujian atau identifikasi batas rate limit
        rule = None
        if method == "POST" and path.endswith("/api/v1/auth/login"):
            rule = ("auth_login", 10, 60)
        elif method == "GET" and path.endswith("/api/v1/orders/track"):
            rule = ("order_track", 30, 60)

        if rule:
            bucket, max_req, window_sec = rule
            allowed, retry_after = rate_limiter.is_allowed(client_ip, bucket, max_req, window_sec)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": (
                            f"Terlalu banyak permintaan ke endpoint ini. "
                            f"Silakan coba lagi dalam {retry_after} detik."
                        )
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "DENY",
                    },
                )

        return await call_next(request)
