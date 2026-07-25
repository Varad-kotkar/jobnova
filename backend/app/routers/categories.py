from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.session import get_session
from ..schemas.job import JobListResponse, JobResponse, PaginationMeta
from ..services.category_service import CategoryService

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_categories(
    search: Optional[str] = Query(None),
    sort: str = Query("jobs", pattern="^(jobs|name)$"),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    cache_key = f"categories:list:{search}:{sort}"
    from ..core.cache import CacheManager
    cached_cats = await CacheManager.get(cache_key)
    if cached_cats:
        return cached_cats

    cats = await CategoryService.get_categories(session=session, search=search, sort_by=sort)
    await CacheManager.set(cache_key, cats, ttl_seconds=1800)
    return cats


@router.get("/{slug}", status_code=status.HTTP_200_OK)
async def get_category_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    cat = await CategoryService.get_category_by_slug(session=session, slug=slug)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with slug '{slug}' not found",
        )
    return cat


@router.get("/{slug}/jobs", response_model=JobListResponse, status_code=status.HTTP_200_OK)
async def list_jobs_by_category(
    slug: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    sort_by: str = Query("newest", pattern="^(newest|oldest|relevance)$"),
    session: AsyncSession = Depends(get_session),
):
    result = await CategoryService.get_category_jobs(
        session=session,
        slug=slug,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with slug '{slug}' not found",
        )

    job_responses = [JobResponse.from_orm_model(job) for job in result["jobs"]]
    meta = PaginationMeta(
        page=result["page"],
        page_size=result["page_size"],
        total=result["total"],
        total_pages=result["total_pages"],
        has_next=result["has_next"],
        has_previous=result["has_previous"],
    )
    return JobListResponse(items=job_responses, pagination=meta)
