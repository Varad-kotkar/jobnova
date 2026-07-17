from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..database.session import get_session
from ..models.job import Job
from ..schemas.job import JobListResponse, JobResponse
from ..services.job_query import query_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/", response_model=JobListResponse, status_code=status.HTTP_200_OK)
async def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    keyword: Optional[str] = Query(None, min_length=1),
    company: Optional[str] = Query(None, min_length=1),
    location: Optional[str] = Query(None, min_length=1),
    remote: Optional[bool] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> JobListResponse:
    jobs, total = await query_jobs(
        session=session,
        page=page,
        page_size=page_size,
        keyword=keyword,
        company=company,
        location=location,
        remote=remote,
    )

    return JobListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            JobResponse(
                id=job.id,
                slug=job.slug,
                title=job.title,
                description=job.description,
                location=job.location,
                company=job.company.name,
                apply_url=job.apply_url,
                skills=job.skills,
                remote=job.remote,
                published_at=job.published_at,
            )
            for job in jobs
        ],
    )


@router.get("/{slug}", response_model=JobResponse, status_code=status.HTTP_200_OK)
async def get_job(slug: str, session: AsyncSession = Depends(get_session)) -> JobResponse:
    query = select(Job).where(Job.slug == slug).options(joinedload(Job.company))
    result = await session.execute(query)
    job = result.scalars().first()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobResponse(
        id=job.id,
        slug=job.slug,
        title=job.title,
        description=job.description,
        location=job.location,
        company=job.company.name,
        apply_url=job.apply_url,
        skills=job.skills,
        remote=job.remote,
        published_at=job.published_at,
    )
