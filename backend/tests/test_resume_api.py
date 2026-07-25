import uuid
import pytest
from fastapi import HTTPException

from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService


@pytest.mark.anyio
async def test_resume_upload_parsing_and_versioning(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    resume_content = b"""
    Jane Doe - Senior Full Stack Software Engineer
    Email: jane.doe@example.com | Phone: +1-555-0192
    Experience: 5 years building scalable web applications.
    Core Tech Skills: Python, FastAPI, React, TypeScript, PostgreSQL, Docker, AWS, Next.js.
    Education: B.S. in Computer Science.
    """

    # 1. Upload & Parse Version 1
    res1 = await ResumeService.upload_and_parse_resume(
        session=async_session,
        user_id=user.id,
        file_bytes=resume_content,
        file_name="Jane_Doe_Resume_v1.pdf",
        file_type="application/pdf",
    )
    assert res1["version"] == 1
    assert "Python" in res1["extracted_skills"]
    assert "React" in res1["extracted_skills"]

    # 2. Upload Version 2
    res2 = await ResumeService.upload_and_parse_resume(
        session=async_session,
        user_id=user.id,
        file_bytes=resume_content + b" Skills: Kubernetes, GraphQL",
        file_name="Jane_Doe_Resume_v2.pdf",
        file_type="application/pdf",
    )
    assert res2["version"] == 2
    assert "Kubernetes" in res2["extracted_skills"]

    # 3. Get Primary Resume
    primary = await ResumeService.get_primary_resume(session=async_session, user_id=user.id)
    assert primary["version"] == 2

    # 4. Get Resume Versions List
    versions = await ResumeService.get_user_resumes(session=async_session, user_id=user.id)
    assert len(versions) == 2
    assert versions[0]["version"] == 2
