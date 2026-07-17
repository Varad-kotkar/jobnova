from fastapi import APIRouter

from ..routers.health import router as health_router
from ..routers.jobs import router as jobs_router


def create_api_router() -> APIRouter:
    router = APIRouter()
    router.include_router(health_router)
    router.include_router(jobs_router)
    return router
