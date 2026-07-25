import uuid
import pytest
from fastapi import HTTPException

from app.routers.auth import register, login, get_me, RegisterRequest, LoginRequest
from app.routers.users import get_profile, update_profile


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
