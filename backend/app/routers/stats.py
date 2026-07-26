from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.session import get_session
from ..models.company import Company
from ..models.job import Job
from ..models.job_application import JobApplication
from ..models.user import User

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", status_code=200)
@router.get("/", status_code=200)
async def get_platform_stats(
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Public endpoint for live platform statistics shown on homepage."""
    jobs_count = (await session.execute(select(func.count(Job.id)))).scalar_one()
    companies_count = (await session.execute(select(func.count(Company.id)))).scalar_one()
    users_count = (await session.execute(select(func.count(User.id)))).scalar_one()
    apps_count = (await session.execute(select(func.count(JobApplication.id)))).scalar_one()
    remote_count = (
        await session.execute(select(func.count(Job.id)).where(Job.remote.is_(True)))
    ).scalar_one()

    return {
        "success": True,
        "data": {
            "total_jobs": jobs_count,
            "total_companies": companies_count,
            "total_users": users_count,
            "total_applications": apps_count,
            "remote_jobs": remote_count,
        },
    }
