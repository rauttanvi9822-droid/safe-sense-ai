"""
SafeSense AI — FastAPI Application (Main entry point)
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog

from backend.config import settings
from backend.database import create_tables
from backend.routers import auth, assessments, chat, checkins, progress, support, moderator, resources, admin

logger = structlog.get_logger()

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SafeSense AI API",
    description="AI-assisted safety and wellbeing support platform API",
    version="1.0.0",
    docs_url="/api/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/api/redoc" if settings.APP_ENV != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Security headers middleware ──────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ─── Request logging ──────────────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Do NOT log request bodies (may contain sensitive wellbeing data)
    response = await call_next(request)
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
    )
    return response


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("Starting SafeSense AI API", env=settings.APP_ENV)
    create_tables()


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(assessments.router, prefix="/api/assessments", tags=["assessments"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(checkins.router, prefix="/api/checkins", tags=["check-ins"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(support.router, prefix="/api/support", tags=["support"])
app.include_router(moderator.router, prefix="/api/moderator", tags=["moderator"])
app.include_router(resources.router, prefix="/api/resources", tags=["resources"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


# ─── Global error handler (never expose internal details) ─────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )
