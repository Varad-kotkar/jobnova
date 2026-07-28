from typing import Any
from fastapi import APIRouter

from ..routers import (
    admin_router,
    ai_match_router,
    applications_router,
    ats_analyzer_router,
    auth_router,
    career_coach_router,
    categories_router,
    companies_router,
    cover_letter_router,
    dashboard_router,
    health_router,
    homepage_sections_router,
    ingestion_router,
    interview_coach_router,
    jobs_router,
    memes_router,
    notifications_router,
    recruiter_router,
    resumes_router,
    saved_jobs_router,
    saved_searches_router,
    stats_router,
    users_router,
)

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
    saved_searches_router,
    applications_router,
    ai_match_router,
    cover_letter_router,
    interview_coach_router,
    career_coach_router,
    ingestion_router,
    stats_router,
    memes_router,
    homepage_sections_router,
]


def register_api_routers(app: Any) -> None:
    """Includes all API sub-routers directly onto the FastAPI application instance."""
    for r in ALL_ROUTERS:
        app.include_router(r)


def create_api_router() -> APIRouter:
    router = APIRouter()
    for r in ALL_ROUTERS:
        router.include_router(r)
    return router
