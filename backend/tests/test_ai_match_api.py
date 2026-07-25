import uuid
from datetime import datetime, timezone
import pytest

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.models.job_listing import JobListing
from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.services.ingestion import ingest_job_listings, _is_valid_quality_job
from app.routers.ai_match import get_job_match_score, get_recommended_jobs


@pytest.mark.anyio
async def test_ingestion_quality_filter():
    valid_listing = JobListing(
        company="Stripe",
        title="Senior Python Backend Developer",
        description="We are looking for a Senior Backend Engineer proficient in Python, FastAPI, PostgreSQL, and microservices architecture. Minimum 200 characters length description text to pass quality validation.",
        location="Remote",
        apply_url="https://stripe.com/apply/123",
        skills=["python", "fastapi"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    assert _is_valid_quality_job(valid_listing) is True

    spam_listing = JobListing(
        company="Course Institute",
        title="Full Stack Web Development Bootcamp",
        description="Join our 6-month placement training program. Pay to apply and registration fee required to get certified.",
        location="Remote",
        apply_url="https://spam.example/apply",
        skills=["html", "css"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    assert _is_valid_quality_job(spam_listing) is False


@pytest.mark.anyio
async def test_ai_match_calculation_and_recommendations(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register candidate user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Upload resume to populate skills
    resume_bytes = b"Jane Doe - Python, FastAPI, PostgreSQL, Docker, AWS, React, Next.js"
    await ResumeService.upload_and_parse_resume(
        async_session, user.id, resume_bytes, "resume.pdf", "application/pdf"
    )

    # Create target job
    company = Company(name=f"Anthropic-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Backend Infrastructure Engineer",
        description="Building FastAPI and Python services with PostgreSQL and Docker.",
        location="Remote",
        apply_url=f"https://anthropic.example/apply/{unique_suffix}",
        slug=f"anthropic-backend-{unique_suffix}",
        skills=["python", "fastapi", "postgresql", "docker"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    # 1. Calculate Match Score
    match_res = await get_job_match_score(job1.id, current_user=user, session=async_session)
    assert match_res["match_score"] >= 70
    assert match_res["recommendation"] in ("Strong Match", "Moderate Match")
    assert "Python" in match_res["matched_skills"]
    assert len(match_res["reasoning"]) >= 1

    # 2. Get Recommended Jobs List
    recs = await get_recommended_jobs(limit=5, current_user=user, session=async_session)
    assert len(recs) >= 1
    assert recs[0]["match_score"] >= 50
