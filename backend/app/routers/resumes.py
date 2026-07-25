from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.resume_service import ResumeService

router = APIRouter(prefix="/api/users/resume", tags=["resumes"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    file_bytes = await file.read()
    return await ResumeService.upload_and_parse_resume(
        session=session,
        user_id=current_user.id,
        file_bytes=file_bytes,
        file_name=file.filename or "resume.pdf",
        file_type=file.content_type or "application/pdf",
    )


@router.get("/primary", status_code=status.HTTP_200_OK)
async def get_primary_resume_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    resume = await ResumeService.get_primary_resume(session=session, user_id=current_user.id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume uploaded yet")
    return resume


@router.get("/versions", status_code=status.HTTP_200_OK)
async def get_resume_versions_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    return await ResumeService.get_user_resumes(session=session, user_id=current_user.id)
