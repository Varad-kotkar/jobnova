from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..database.session import get_session
from ..models.job import Job
from ..schemas.job import JobListResponse, JobResponse, PaginationMeta
from ..services.job_query import query_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=JobListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=JobListResponse, status_code=status.HTTP_200_OK)
async def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    keyword: Optional[str] = Query(None, min_length=1),
    company: Optional[str] = Query(None, min_length=1),
    location: Optional[str] = Query(None, min_length=1),
    remote: Optional[bool] = Query(None),
    sort_by: str = Query("newest", pattern="^(newest|oldest|relevance)$"),
    session: AsyncSession = Depends(get_session),
) -> JobListResponse:
    cache_key = f"jobs:list:{page}:{page_size}:{keyword}:{company}:{location}:{remote}:{sort_by}"
    from ..core.cache import CacheManager
    cached_res = await CacheManager.get(cache_key)
    if cached_res:
        return JobListResponse(**cached_res)

    jobs, meta = await query_jobs(
        session=session,
        page=page,
        page_size=page_size,
        keyword=keyword,
        company=company,
        location=location,
        remote=remote,
        sort_by=sort_by,
    )

    job_responses = [JobResponse.from_orm_model(job) for job in jobs]
    meta_response = PaginationMeta(**meta)
    res = JobListResponse(items=job_responses, pagination=meta_response)
    await CacheManager.set(cache_key, res.model_dump(), ttl_seconds=300)
    return res


@router.get("/{id_or_slug}", response_model=JobResponse, status_code=status.HTTP_200_OK)
async def get_job_by_id_or_slug(
    id_or_slug: str,
    session: AsyncSession = Depends(get_session),
) -> JobResponse:
    clean_identifier = id_or_slug.lower().strip()

    # 1. Primary lookup by exact slug
    stmt = select(Job).options(joinedload(Job.company)).where(Job.slug == clean_identifier)
    result = await session.execute(stmt)
    job = result.scalars().first()

    # 2. Fallback lookup by exact id if slug lookup missed
    if not job:
        stmt_id = select(Job).options(joinedload(Job.company)).where(Job.id == id_or_slug)
        result_id = await session.execute(stmt_id)
        job = result_id.scalars().first()

    # 3. Fallback partial slug or prefix lookup for composite URLs (/jobs/{slug}-{short_id})
    if not job:
        from sqlalchemy import or_
        short_id = clean_identifier.split("-")[-1]
        stmt_partial = (
            select(Job)
            .options(joinedload(Job.company))
            .where(
                or_(
                    Job.slug.like(f"%{clean_identifier}%"),
                    Job.id.like(f"%{short_id}%"),
                )
            )
        )
        result_partial = await session.execute(stmt_partial)
        job = result_partial.scalars().first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with identifier or slug '{id_or_slug}' not found",
        )

    return JobResponse.from_orm_model(job)
