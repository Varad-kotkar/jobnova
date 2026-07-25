from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.session import get_session
from ..schemas.job import JobListResponse, JobResponse, PaginationMeta
from ..services.category_service import CategoryService

router = APIRouter(prefix="/api/categories", tags=["categories"])


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
async def get_category(
    slug: str,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    cat = await CategoryService.get_category_by_slug(session=session, slug=slug)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{slug}' not found",
        )
    return cat


@router.get("/{slug}/jobs", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_category_jobs(
    slug: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    category_meta, jobs, meta = await CategoryService.get_category_jobs(
        session=session,
        slug=slug,
        page=page,
        page_size=page_size,
    )

    if not category_meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{slug}' not found",
        )

    return {
        "category": category_meta,
        "items": [
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
            ).model_dump(mode="json")
            for job in jobs
        ],
        "pagination": meta,
    }
