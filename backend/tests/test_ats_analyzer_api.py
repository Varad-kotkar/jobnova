import uuid
from datetime import datetime, timezone
import pytest

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.routers.ats_analyzer import get_ats_score_endpoint, AnalyzePayload


@pytest.mark.anyio
async def test_ats_resume_analyzer(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register candidate user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Target Job
    company = Company(name=f"Stripe-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Staff Backend Engineer",
        description="Looking for Python, FastAPI, PostgreSQL, Redis, Docker, and AWS skills.",
        location="Remote",
        apply_url=f"https://stripe.example/apply/{unique_suffix}",
        slug=f"stripe-backend-{unique_suffix}",
        skills=["python", "fastapi", "postgresql", "redis", "docker", "aws"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    # Upload Primary Resume
    resume_bytes = b"""
    John Doe - Senior Software Engineer
    Email: john@example.com
    Experience: Built microservices using Python, FastAPI, PostgreSQL, and Docker.
    Skills: Python, FastAPI, PostgreSQL, Docker, Git.
    Education: Bachelor of Science in Computer Science.
    """
    await ResumeService.upload_and_parse_resume(
        async_session, user.id, resume_bytes, "john_doe_resume.pdf", "application/pdf"
    )

    # Calculate ATS Score
    res = await get_ats_score_endpoint(job_id=job1.id, current_user=user, session=async_session)
    assert res["ats_score"] >= 60
    assert "Python" in res["matched_keywords"]
    assert "Redis" in res["missing_keywords"] or "Aws" in res["missing_keywords"] or "AWS" in res["missing_keywords"]
    assert len(res["recommended_changes"]) >= 1
    assert "keyword_coverage" in res["score_breakdown"]
