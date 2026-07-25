import uuid
from datetime import datetime, timezone
import pytest

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.routers.cover_letter import generate_cover_letter_endpoint, CoverLetterPayload


@pytest.mark.anyio
async def test_ai_cover_letter_generation(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Upload resume
    resume_bytes = b"Jane Doe - Python, FastAPI, PostgreSQL, Next.js"
    await ResumeService.upload_and_parse_resume(async_session, user.id, resume_bytes, "resume.pdf", "application/pdf")

    # Create job
    company = Company(name=f"Linear-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Full Stack Product Engineer",
        description="Building Next.js and Python tools.",
        location="Remote",
        apply_url=f"https://linear.example/apply/{unique_suffix}",
        slug=f"linear-engineer-{unique_suffix}",
        skills=["next.js", "python"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    # 1. Generate Professional Cover Letter
    res_prof = await generate_cover_letter_endpoint(
        job1.id,
        payload=CoverLetterPayload(tone="Professional"),
        current_user=user,
        session=async_session,
    )
    assert f"Linear-{unique_suffix}" in res_prof["cover_letter"]
    assert "Full Stack Product Engineer" in res_prof["cover_letter"]
    assert res_prof["tone"] == "Professional"
    assert res_prof["personalization_score"] >= 70

    # 2. Generate Startup Tone Cover Letter
    res_startup = await generate_cover_letter_endpoint(
        job1.id,
        payload=CoverLetterPayload(tone="Startup"),
        current_user=user,
        session=async_session,
    )
    assert res_startup["tone"] == "Startup"
    assert "fast-paced startup" in res_startup["cover_letter"].lower()
