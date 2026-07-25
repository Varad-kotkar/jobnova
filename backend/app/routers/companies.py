from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.session import get_session
from ..services.company_service import CompanyService

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_companies(
    search: Optional[str] = Query(None, alias="search"),
    keyword: Optional[str] = Query(None),
    sort: str = Query("jobs", pattern="^(jobs|name|recent)$"),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    query_term = search or keyword
    return await CompanyService.get_companies(
        session=session,
        search=query_term,
        sort_by=sort,
    )


@router.get("/{slug}", status_code=status.HTTP_200_OK)
async def get_company_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    company = await CompanyService.get_company_by_slug(session=session, slug=slug)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with slug '{slug}' not found",
        )
    return company
