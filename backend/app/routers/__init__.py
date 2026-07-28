from .admin import router as admin_router
from .ai_match import router as ai_match_router
from .applications import router as applications_router
from .ats_analyzer import router as ats_analyzer_router
from .auth import router as auth_router
from .career_coach import router as career_coach_router
from .categories import router as categories_router
from .companies import router as companies_router
from .cover_letter import router as cover_letter_router
from .dashboard import router as dashboard_router
from .health import router as health_router
from .homepage_sections import router as homepage_sections_router
from .ingestion import router as ingestion_router
from .interview_coach import router as interview_coach_router
from .jobs import router as jobs_router
from .memes import router as memes_router
from .notifications import router as notifications_router
from .recruiter import router as recruiter_router
from .resumes import router as resumes_router
from .saved_jobs import router as saved_jobs_router
from .saved_searches import router as saved_searches_router
from .stats import router as stats_router
from .users import router as users_router

__all__ = [
    "admin_router",
    "ai_match_router",
    "applications_router",
    "ats_analyzer_router",
    "auth_router",
    "career_coach_router",
    "categories_router",
    "companies_router",
    "cover_letter_router",
    "dashboard_router",
    "health_router",
    "homepage_sections_router",
    "ingestion_router",
    "interview_coach_router",
    "jobs_router",
    "memes_router",
    "notifications_router",
    "recruiter_router",
    "resumes_router",
    "saved_jobs_router",
    "saved_searches_router",
    "stats_router",
    "users_router",
]
