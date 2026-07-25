import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select

from .api import create_api_router
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
    except Exception as exc:
        logger.exception("Scheduled ingestion failed", extra={"error": str(exc)})


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

    # Periodic background loop running every 6 hours
    while True:
        try:
            await asyncio.sleep(6 * 3600)
            logger.info("Triggering 6-hour periodic job ingestion...")
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

    origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception occurred", extra={"path": request.url.path})
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    app.include_router(create_api_router())
    return app


app = create_application()
