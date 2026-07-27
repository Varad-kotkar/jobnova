from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.saved_search import SavedSearch
from ..models.user import User

router = APIRouter(prefix="/api/saved-searches", tags=["saved-searches"])


class CreateSavedSearchPayload(BaseModel):
    label: str
    query: str
    filters: Optional[Dict[str, Any]] = None
    notify: Optional[bool] = True


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    payload: CreateSavedSearchPayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    search_record = SavedSearch(
        user_id=current_user.id,
        label=payload.label.strip(),
        query=payload.query.strip(),
        filters=payload.filters or {},
        notify=payload.notify if payload.notify is not None else True,
    )
    session.add(search_record)
    await session.commit()

    return {
        "id": search_record.id,
        "label": search_record.label,
        "query": search_record.query,
        "filters": search_record.filters,
        "notify": search_record.notify,
        "created_at": search_record.created_at.isoformat() if search_record.created_at else None,
    }


@router.get("/", status_code=status.HTTP_200_OK)
async def list_saved_searches(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    stmt = select(SavedSearch).where(SavedSearch.user_id == current_user.id).order_by(SavedSearch.created_at.desc())
    res = await session.execute(stmt)
    records = res.scalars().all()

    return [
        {
            "id": r.id,
            "label": r.label,
            "query": r.query,
            "filters": r.filters,
            "notify": r.notify,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.delete("/{search_id}", status_code=status.HTTP_200_OK)
async def delete_saved_search(
    search_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    stmt = select(SavedSearch).where((SavedSearch.id == search_id) & (SavedSearch.user_id == current_user.id))
    res = await session.execute(stmt)
    record = res.scalars().first()

    if record:
        await session.delete(record)
        await session.commit()

    return {"id": search_id, "deleted": True}
