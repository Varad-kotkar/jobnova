from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..database.session import get_session
from ..models.job import Job
from ..schemas.job import HomeJobsResponse, JobListResponse, JobResponse, PaginationMeta, TrendingCompany, SectionMeta
from ..services.job_query import query_jobs, query_home_jobs

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
    # New structured filters (additive, backward compatible)
    employment_type: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    is_internship: Optional[bool] = Query(None),
    is_fresher: Optional[bool] = Query(None),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> JobListResponse:
    cache_key = (
        f"jobs:list:{page}:{page_size}:{keyword}:{company}:{location}:{remote}:{sort_by}"
        f":{employment_type}:{experience_level}:{is_internship}:{is_fresher}"
        f":{country}:{city}:{state}:{category}"
    )
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
        employment_type=employment_type,
        experience_level=experience_level,
        is_internship=is_internship,
        is_fresher=is_fresher,
        country=country,
        city=city,
        state=state,
        category=category,
    )

    job_responses = [JobResponse.from_orm_model(job) for job in jobs]
    meta_response = PaginationMeta(**meta)
    res = JobListResponse(items=job_responses, pagination=meta_response)
    await CacheManager.set(cache_key, res.model_dump(), ttl_seconds=300)
    return res


@router.get("/home", response_model=HomeJobsResponse, status_code=status.HTTP_200_OK)
async def get_home_jobs(
    session: AsyncSession = Depends(get_session),
) -> HomeJobsResponse:
    cache_key = "jobs:home:curated:v2"
    from ..core.cache import CacheManager
    cached_res = await CacheManager.get(cache_key)
    if cached_res:
        return HomeJobsResponse(**cached_res)

    home_data = await query_home_jobs(session)

    def _to_job_responses(key: str) -> list:
        return [JobResponse.from_orm_model(j) for j in home_data.get(key, [])]

    section_data: dict = {}
    for section_meta in home_data.get("sections", []):
        key = section_meta["key"]
        if key in home_data and key not in ("developer_corner", "trending_companies"):
            section_data[key] = _to_job_responses(key)

    res = HomeJobsResponse(
        # Backward-compatible named fields
        india_jobs=_to_job_responses("india_jobs"),
        remote_jobs=_to_job_responses("remote_jobs"),
        internships=_to_job_responses("internships"),
        freshers=_to_job_responses("freshers"),
        latest=_to_job_responses("latest"),
        # Extended
        sections=[SectionMeta(**s) for s in home_data.get("sections", [])],
        trending_companies=[TrendingCompany(**c) for c in home_data.get("trending_companies", [])],
        section_data=section_data,
    )
    await CacheManager.set(cache_key, res.model_dump(), ttl_seconds=300)
    return res


@router.get("/{id_or_slug}", response_model=JobResponse, status_code=status.HTTP_200_OK)
async def get_job_by_id_or_slug(
    id_or_slug: str,
    session: AsyncSession = Depends(get_session),
) -> JobResponse:
    clean_identifier = id_or_slug.lower().strip()

    stmt = select(Job).options(joinedload(Job.company)).where(Job.slug == clean_identifier)
    result = await session.execute(stmt)
    job = result.scalars().first()

    if not job:
        from sqlalchemy import or_
        stmt_id = select(Job).options(joinedload(Job.company)).where(
            or_(Job.id == id_or_slug, Job.id == clean_identifier)
        )
        result_id = await session.execute(stmt_id)
        job = result_id.scalars().first()

    if not job and "-" in clean_identifier:
        parts = clean_identifier.split("-")
        potential_uuid = parts[-1]
        if len(potential_uuid) >= 8:
            stmt_composite = (
                select(Job)
                .options(joinedload(Job.company))
                .where(Job.id.startswith(potential_uuid))
            )
            result_comp = await session.execute(stmt_composite)
            job = result_comp.scalars().first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with identifier or slug '{id_or_slug}' not found",
        )

    return JobResponse.from_orm_model(job)
