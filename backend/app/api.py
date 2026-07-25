from fastapi import APIRouter

from .routers.ai_match import router as ai_match_router
from .routers.applications import router as applications_router
from .routers.ats_analyzer import router as ats_analyzer_router
from .routers.auth import router as auth_router
from .routers.career_coach import router as career_coach_router
from .routers.categories import router as categories_router
from .routers.companies import router as companies_router
from .routers.cover_letter import router as cover_letter_router
from .routers.dashboard import router as dashboard_router
from .routers.health import router as health_router
from .routers.ingestion import router as ingestion_router
from .routers.interview_coach import router as interview_coach_router
from .routers.jobs import router as jobs_router
from .routers.notifications import router as notifications_router
from .routers.recruiter import router as recruiter_router
from .routers.resumes import router as resumes_router
from .routers.saved_jobs import router as saved_jobs_router
from .routers.users import router as users_router


def create_api_router() -> APIRouter:
    router = APIRouter()
    router.include_router(health_router)
    router.include_router(auth_router)
    router.include_router(users_router)
    router.include_router(resumes_router)
    router.include_router(notifications_router)
    router.include_router(recruiter_router)
    router.include_router(ats_analyzer_router)
    router.include_router(dashboard_router)
    router.include_router(jobs_router)
    router.include_router(companies_router)
    router.include_router(categories_router)
    router.include_router(saved_jobs_router)
    router.include_router(applications_router)
    router.include_router(ai_match_router)
    router.include_router(cover_letter_router)
    router.include_router(interview_coach_router)
    router.include_router(career_coach_router)
    router.include_router(ingestion_router)
    return router
