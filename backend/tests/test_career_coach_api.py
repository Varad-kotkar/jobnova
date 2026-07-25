import uuid
import pytest

from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.routers.career_coach import get_career_roadmap_endpoint


@pytest.mark.anyio
async def test_ai_career_coach_roadmap(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Upload primary resume
    resume_bytes = b"Jane Doe - Python, FastAPI, PostgreSQL, React"
    await ResumeService.upload_and_parse_resume(async_session, user.id, resume_bytes, "resume.pdf", "application/pdf")

    # Generate Career Roadmap
    roadmap = await get_career_roadmap_endpoint(current_user=user, session=async_session)
    assert roadmap["career_confidence_score"] >= 50
    assert "career_stage" in roadmap
    assert len(roadmap["plan_30_day"]) >= 2
    assert len(roadmap["plan_60_day"]) >= 2
    assert len(roadmap["plan_90_day"]) >= 2
    assert "min" in roadmap["salary_projection"]
    assert len(roadmap["recommended_projects"]) >= 1
