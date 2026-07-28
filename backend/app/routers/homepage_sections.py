"""Homepage sections configuration router."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.rbac import require_roles
from ..database.session import get_session
from ..models.homepage_section import HomepageSection
from ..models.user import User

router = APIRouter(prefix="/api/homepage", tags=["homepage"])


class SectionUpdate(BaseModel):
    enabled: Optional[bool] = None
    order: Optional[int] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    limit: Optional[int] = None
    view_all_href: Optional[str] = None
    view_all_label: Optional[str] = None


def _section_to_dict(s: HomepageSection) -> Dict[str, Any]:
    return {
        "id": s.id,
        "key": s.key,
        "title": s.title,
        "subtitle": s.subtitle,
        "icon": s.icon,
        "enabled": s.enabled,
        "order": s.order,
        "query_filter": s.query_filter,
        "view_all_href": s.view_all_href,
        "view_all_label": s.view_all_label,
        "limit": s.limit,
    }


@router.get("/sections", status_code=status.HTTP_200_OK)
async def get_homepage_sections(
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Public endpoint — returns all homepage section config ordered by position."""
    stmt = select(HomepageSection).order_by(HomepageSection.order)
    result = await session.execute(stmt)
    sections = result.scalars().all()
    return {"success": True, "data": [_section_to_dict(s) for s in sections]}


@router.patch("/sections/{key}", status_code=status.HTTP_200_OK)
async def update_homepage_section(
    key: str,
    payload: SectionUpdate,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Admin — enable/disable/reorder/rename a homepage section."""
    result = await session.execute(
        select(HomepageSection).where(HomepageSection.key == key)
    )
    section = result.scalars().first()
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Homepage section '{key}' not found",
        )

    if payload.enabled is not None:
        section.enabled = payload.enabled
    if payload.order is not None:
        section.order = payload.order
    if payload.title is not None:
        section.title = payload.title
    if payload.subtitle is not None:
        section.subtitle = payload.subtitle
    if payload.limit is not None:
        section.limit = max(1, min(payload.limit, 24))
    if payload.view_all_href is not None:
        section.view_all_href = payload.view_all_href
    if payload.view_all_label is not None:
        section.view_all_label = payload.view_all_label

    await session.commit()
    await session.refresh(section)

    # Invalidate home cache
    from ..core.cache import CacheManager
    await CacheManager.delete_pattern("jobs:home:")

    return {"success": True, "data": _section_to_dict(section)}
