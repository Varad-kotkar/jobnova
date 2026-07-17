import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api import create_api_router
from .config.settings import settings, database_config
from .database.connection import connect_to_database, disconnect_from_database
from .logging_config import configure_logging

configure_logging()
logger = logging.getLogger("backend.app")


@asynccontextmanager
async def lifespan(application: FastAPI):
    logger.info("Application startup", extra={"event": "startup", "environment": settings.environment})
    await connect_to_database(database_config.database_url)
    yield
    logger.info("Application shutdown", extra={"event": "shutdown"})
    await disconnect_from_database()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=settings.docs_url,
        openapi_url=settings.openapi_url,
        lifespan=lifespan,
    )
    app.include_router(create_api_router())
    return app


app = create_application()
