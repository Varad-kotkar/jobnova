"""Memes router — Developer Corner content management."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.rbac import require_roles
from ..database.session import get_session
from ..models.meme import Meme
from ..models.user import User

router = APIRouter(prefix="/api/memes", tags=["memes"])

VALID_CATEGORIES = {"developer", "placement", "interview", "motivation", "humor"}


class MemeCreate(BaseModel):
    title: str
    image_url: str
    category: str = "developer"
    alt_text: Optional[str] = None
    source: Optional[str] = "admin_upload"
    is_pinned: bool = False


class MemeUpdate(BaseModel):
    is_pinned: Optional[bool] = None
    is_active: Optional[bool] = None
    category: Optional[str] = None
    title: Optional[str] = None


def _meme_to_dict(m: Meme) -> Dict[str, Any]:
    return {
        "id": m.id,
        "title": m.title,
        "image_url": m.image_url,
        "category": m.category,
        "is_pinned": m.is_pinned,
        "is_active": m.is_active,
        "source": m.source,
        "alt_text": m.alt_text,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.get("", status_code=status.HTTP_200_OK)
async def list_memes(
    category: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Public endpoint — returns active memes, pinned first."""
    stmt = select(Meme).where(Meme.is_active == True)
    if category and category in VALID_CATEGORIES:
        stmt = stmt.where(Meme.category == category)
    stmt = stmt.order_by(Meme.is_pinned.desc(), Meme.created_at.desc()).limit(20)
    result = await session.execute(stmt)
    memes = result.scalars().all()
    return {"success": True, "data": [_meme_to_dict(m) for m in memes]}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_meme(
    payload: MemeCreate,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Choose from: {', '.join(VALID_CATEGORIES)}",
        )
    meme = Meme(
        title=payload.title,
        image_url=payload.image_url,
        category=payload.category,
        alt_text=payload.alt_text,
        source=payload.source or "admin_upload",
        is_pinned=payload.is_pinned,
        is_active=True,
    )
    session.add(meme)
    await session.commit()
    await session.refresh(meme)
    return {"success": True, "data": _meme_to_dict(meme)}


@router.patch("/{meme_id}", status_code=status.HTTP_200_OK)
async def update_meme(
    meme_id: str,
    payload: MemeUpdate,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    result = await session.execute(select(Meme).where(Meme.id == meme_id))
    meme = result.scalars().first()
    if not meme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meme not found")

    if payload.is_pinned is not None:
        meme.is_pinned = payload.is_pinned
    if payload.is_active is not None:
        meme.is_active = payload.is_active
    if payload.category is not None:
        if payload.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid category")
        meme.category = payload.category
    if payload.title is not None:
        meme.title = payload.title

    await session.commit()
    await session.refresh(meme)
    return {"success": True, "data": _meme_to_dict(meme)}


@router.delete("/{meme_id}", status_code=status.HTTP_200_OK)
async def delete_meme(
    meme_id: str,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    result = await session.execute(select(Meme).where(Meme.id == meme_id))
    meme = result.scalars().first()
    if not meme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meme not found")
    await session.delete(meme)
    await session.commit()
    return {"success": True, "message": f"Meme {meme_id} deleted"}
