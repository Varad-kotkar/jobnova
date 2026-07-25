from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.auth_service import AuthService
from ..services.user_service import UserService

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    user, token = await AuthService.register_user(
        session=session,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
    )
    user_info = await UserService.get_user_profile(session, user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info,
    }


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    user, token = await AuthService.authenticate_user(
        session=session,
        email=payload.email,
        password=payload.password,
    )
    user_info = await UserService.get_user_profile(session, user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info,
    }


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await UserService.get_user_profile(session, current_user.id)
