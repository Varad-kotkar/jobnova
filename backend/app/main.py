import logging

from fastapi import FastAPI

from .api import create_api_router
from .config.settings import settings
from .database.connection import connect_to_database, disconnect_from_database
from .logging_config import configure_logging

configure_logging()
logger = logging.getLogger("backend.app")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=settings.docs_url,
        openapi_url=settings.openapi_url,
    )
    app.include_router(create_api_router())
    app.add_event_handler("startup", startup)
    app.add_event_handler("shutdown", shutdown)
    return app


async def startup() -> None:
    logger.info("Application startup", extra={"event": "startup", "environment": settings.environment})
    await connect_to_database()


async def shutdown() -> None:
    logger.info("Application shutdown", extra={"event": "shutdown"})
    await disconnect_from_database()


app = create_application()
