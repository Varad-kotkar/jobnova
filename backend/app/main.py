import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select

from .api import register_api_routers
from .config.settings import database_config, settings
from .core.orchestrator import PluginOrchestrator
from .database.connection import connect_to_database, disconnect_from_database
from .database.session import get_async_sessionmaker
from .logging_config import configure_logging
from .models.job import Job

configure_logging()
logger = logging.getLogger("backend.app")


async def _run_scheduled_ingestion() -> None:
    try:
        orchestrator = PluginOrchestrator()
        await orchestrator.initialize()
        await orchestrator.run()

        from .services.ingestion import purge_expired_jobs
        await purge_expired_jobs(max_age_days=3)
    except Exception as exc:
        logger.exception("Scheduled ingestion or job purge failed", extra={"error": str(exc)})


import os
from .models.user import User
from .core.security import hash_password


async def _ensure_permanent_admin() -> None:
    try:
        sessionmaker = get_async_sessionmaker()
        async with sessionmaker() as session:
            admin_email = os.getenv("ADMIN_EMAIL", "kotkarvarad12@gmail.com").strip().lower()
            stmt = select(User).where(User.email == admin_email)
            res = await session.execute(stmt)
            admin_user = res.scalars().first()

            if admin_user:
                if admin_user.role != "admin":
                    admin_user.role = "admin"
                    await session.commit()
                    logger.info("Upgraded permanent admin role for %s", admin_email)
            else:
                initial_pass = os.getenv("ADMIN_PASSWORD", "AdminJobNova2026!")
                new_admin = User(
                    email=admin_email,
                    hashed_password=hash_password(initial_pass),
                    full_name="System Administrator",
                    role="admin",
                    is_active=True,
                )
                session.add(new_admin)
                await session.commit()
                logger.info("Provisioned permanent admin account %s", admin_email)
    except Exception as exc:
        logger.exception("Permanent admin provisioning failed: %s", exc)


async def _initial_check_and_scheduler() -> None:
    try:
        sessionmaker = get_async_sessionmaker()
        async with sessionmaker() as session:
            result = await session.execute(select(func.count()).select_from(Job))
            job_count = result.scalar_one()

        if job_count == 0:
            logger.info("Jobs table is empty on startup. Triggering initial automatic ingestion...")
            await _run_scheduled_ingestion()
        else:
            logger.info("Jobs table contains %d listings on startup.", job_count)
    except Exception as exc:
        logger.exception("Initial ingestion check failed", extra={"error": str(exc)})

    # Periodic background loop running every 1 hour (3600 seconds)
    while True:
        try:
            await asyncio.sleep(3600)
            logger.info("Triggering 1-hour periodic job ingestion...")
            await _run_scheduled_ingestion()
        except asyncio.CancelledError:
            logger.info("Background ingestion scheduler stopped.")
            break
        except Exception as exc:
            logger.exception("Error in background ingestion loop", extra={"error": str(exc)})


@asynccontextmanager
async def lifespan(application: FastAPI):
    logger.info("Application startup", extra={"event": "startup", "environment": settings.environment})
    await connect_to_database(database_config.database_url)

    await _ensure_permanent_admin()
    
    ingestion_task = asyncio.create_task(_initial_check_and_scheduler())
    yield
    
    logger.info("Application shutdown", extra={"event": "shutdown"})
    ingestion_task.cancel()
    try:
        await ingestion_task
    except asyncio.CancelledError:
        pass
    await disconnect_from_database()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=settings.docs_url,
        openapi_url=settings.openapi_url,
        lifespan=lifespan,
    )

    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://jobnova-w5xp.onrender.com",
        "https://jobnova-gata-8wrmrvto5-varad-kotkars-projects.vercel.app",
    ]
    extra_cors = (settings.cors_origins or settings.allowed_cors_origins or "").split(",")
    env_origins = [origin.strip() for origin in (settings.allowed_origins + "," + ",".join(extra_cors)).split(",") if origin.strip()]
    all_origins = list(dict.fromkeys(default_origins + env_origins))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=all_origins,
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    import time
    import uuid
    from fastapi.responses import PlainTextResponse
    from .core.telemetry import TelemetryService

    @app.middleware("http")
    async def observability_and_security_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start_time = time.perf_counter()

        user_agent = request.headers.get("User-Agent", "").lower()
        if any(bot in user_agent for bot in ["sqlmap", "nikto", "dirbuster", "gobuster"]):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"success": False, "error": {"code": "BOT_DETECTED", "message": "Automated scraper blocked."}},
            )

        response = await call_next(request)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        TelemetryService.record_request(request.method, request.url.path, response.status_code, latency_ms)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{latency_ms}ms"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Swagger UI & OpenAPI CSP relaxation so /docs renders CDN resources cleanly
        path = request.url.path
        if path.startswith("/docs") or path.startswith("/redoc") or path == "/openapi.json":
            response.headers["Content-Security-Policy"] = (
                "default-src 'self' https://cdn.jsdelivr.net https://fastapi.tiangolo.com; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com https://cdn.jsdelivr.net;"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self' https://cdn.jsdelivr.net https://fastapi.tiangolo.com; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com; "
                "connect-src 'self' https://www.google-analytics.com; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com https://cdn.jsdelivr.net;"
            )

        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        return response

    @app.get("/", status_code=status.HTTP_200_OK, tags=["root"])
    async def root():
        return {
            "status": "ok",
            "app_name": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
            "openapi": "/openapi.json",
        }

    @app.get("/metrics", response_class=PlainTextResponse, status_code=status.HTTP_200_OK, tags=["telemetry"])
    async def metrics_endpoint():
        return TelemetryService.get_metrics_prometheus()

    @app.get("/health/ready", status_code=status.HTTP_200_OK, tags=["telemetry"])
    async def readiness_probe():
        return {"success": True, "status": "ready", "database": "connected", "cache": "ready"}

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": {"code": "HTTP_ERROR", "message": str(exc.detail)}},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"success": False, "error": {"code": "VALIDATION_ERROR", "details": exc.errors()}},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception occurred", extra={"path": request.url.path})
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}},
        )

    # Register API routers
    register_api_routers(app)

    # Log every registered route recursively at startup
    def _log_routes_recursively(routes_list):
        for r in routes_list:
            if hasattr(r, "original_router"):
                _log_routes_recursively(r.original_router.routes)
            elif hasattr(r, "routes"):
                _log_routes_recursively(r.routes)
            elif hasattr(r, "path"):
                methods = getattr(r, "methods", None)
                logger.info("%s %s", methods, r.path)

    _log_routes_recursively(app.routes)

    return app


app = create_application()
