from fastapi import APIRouter

from ..routers.admin import router as admin_router
from ..routers.ai_match import router as ai_match_router
from ..routers.applications import router as applications_router
from ..routers.ats_analyzer import router as ats_analyzer_router
from ..routers.auth import router as auth_router
from ..routers.career_coach import router as career_coach_router
from ..routers.categories import router as categories_router
from ..routers.companies import router as companies_router
from ..routers.cover_letter import router as cover_letter_router
from ..routers.dashboard import router as dashboard_router
from ..routers.health import router as health_router
from ..routers.ingestion import router as ingestion_router
from ..routers.interview_coach import router as interview_coach_router
from ..routers.jobs import router as jobs_router
from ..routers.notifications import router as notifications_router
from ..routers.recruiter import router as recruiter_router
from ..routers.resumes import router as resumes_router
from ..routers.saved_jobs import router as saved_jobs_router
from ..routers.stats import router as stats_router
from ..routers.users import router as users_router

ALL_ROUTERS = [
    health_router,
    admin_router,
    auth_router,
    users_router,
    resumes_router,
    notifications_router,
    recruiter_router,
    ats_analyzer_router,
    dashboard_router,
    jobs_router,
    companies_router,
    categories_router,
    saved_jobs_router,
    applications_router,
    ai_match_router,
    cover_letter_router,
    interview_coach_router,
    career_coach_router,
    ingestion_router,
    stats_router,
]


def create_api_router() -> APIRouter:
    router = APIRouter()
    for r in ALL_ROUTERS:
        router.include_router(r)
    return router

