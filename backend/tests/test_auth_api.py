import uuid
import pytest
from fastapi import HTTPException

from app.routers.auth import register, login, get_me, RegisterRequest, LoginRequest
from app.routers.users import get_profile, update_profile
from app.services.auth_service import AuthService
from app.services.user_service import UserService


@pytest.mark.anyio
async def test_auth_registration_login_and_profile(async_session):
    unique_suffix = str(uuid.uuid4())[:8]
    email = f"candidate-{unique_suffix}@example.com"
    password = "password123"
    full_name = f"Jane Candidate {unique_suffix}"

    # 1. Register User
    reg_req = RegisterRequest(email=email, password=password, full_name=full_name)
    reg_resp = await register(reg_req, session=async_session)
    assert "access_token" in reg_resp
    assert reg_resp["user"]["email"] == email
    assert reg_resp["user"]["full_name"] == full_name

    token = reg_resp["access_token"]

    # 2. Login User
    login_req = LoginRequest(email=email, password=password)
    login_resp = await login(login_req, session=async_session)
    assert "access_token" in login_resp
    assert login_resp["user"]["email"] == email

    # 3. Test duplicate email registration failure (409)
    with pytest.raises(HTTPException) as exc_info:
        await register(reg_req, session=async_session)
    assert exc_info.value.status_code == 409

    # 4. Test wrong password login failure (401)
    wrong_login = LoginRequest(email=email, password="wrongpassword")
    with pytest.raises(HTTPException) as exc_info:
        await login(wrong_login, session=async_session)
    assert exc_info.value.status_code == 401

    # 5. Test Google Login (Firebase SSO registration path)
    google_email = f"google-{unique_suffix}@example.com"
    google_user, google_token = await AuthService.register_user(
        session=async_session,
        email=google_email,
        password="firebase-managed-auth-session",
        full_name=f"Google User {unique_suffix}",
    )
    assert google_user.email == google_email
    assert google_token is not None

    google_profile = await UserService.get_user_profile(async_session, google_user.id)
    assert google_profile["profile"]["onboarding_completed"] is False

    # 6. Test Onboarding Profile Update
    updated_profile = await UserService.update_user_profile(
        async_session,
        google_user.id,
        {
            "headline": "Senior Software Engineer",
            "onboarding_completed": True,
            "availability": "Immediately",
            "work_authorization": "US Citizen",
            "experience_years": 5,
        },
    )
    assert updated_profile["profile"]["onboarding_completed"] is True
    assert updated_profile["profile"]["availability"] == "Immediately"
    assert updated_profile["profile"]["work_authorization"] == "US Citizen"
    assert updated_profile["profile"]["experience_years"] == 5

    # 7. Test /api/auth/me profile retrieve
    me_resp = await get_me(current_user=google_user, session=async_session)
    assert me_resp["id"] == google_user.id
    assert me_resp["profile"]["onboarding_completed"] is True

