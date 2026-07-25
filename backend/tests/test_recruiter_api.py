import uuid
import pytest

from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.routers.applications import create_application_endpoint, CreateApplicationPayload
from app.routers.recruiter import (
    create_recruiter_job_endpoint,
    get_recruiter_applications_endpoint,
    update_applicant_status_endpoint,
    CreateRecruiterJobPayload,
    UpdateApplicantStatusPayload,
)
from app.routers.notifications import get_notifications_endpoint


@pytest.mark.anyio
async def test_recruiter_portal_and_pipeline_management(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # 1. Register Recruiter
    rec_reg = RegisterRequest(
        email=f"recruiter-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Recruiter {unique_suffix}",
    )
    await register(rec_reg, session=async_session)
    recruiter_user, _ = await AuthService.authenticate_user(async_session, rec_reg.email, "password123")

    # 2. Recruiter Posts Job
    job_payload = CreateRecruiterJobPayload(
        title="Staff Distributed Systems Engineer",
        description="Building high performance distributed systems in Rust and Python.",
        company_name=f"ScaleAI-{unique_suffix}",
        location="Remote",
        remote=True,
        skills=["rust", "python", "distributed systems"],
    )
    posted_job = await create_recruiter_job_endpoint(job_payload, current_user=recruiter_user, session=async_session)
    assert posted_job["company"] == f"ScaleAI-{unique_suffix}"

    # 3. Register Candidate and Upload Resume
    cand_reg = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(cand_reg, session=async_session)
    candidate_user, _ = await AuthService.authenticate_user(async_session, cand_reg.email, "password123")

    resume_bytes = b"Candidate Resume - Python, Rust, Distributed Systems, Docker"
    await ResumeService.upload_and_parse_resume(async_session, candidate_user.id, resume_bytes, "resume.pdf", "application/pdf")

    # 4. Candidate Applies
    app_res = await create_application_endpoint(
        CreateApplicationPayload(job_id=posted_job["id"], status="Applied"),
        current_user=candidate_user,
        session=async_session,
    )

    # 5. Recruiter Queries Applicants
    rec_apps = await get_recruiter_applications_endpoint(current_user=recruiter_user, session=async_session)
    assert len(rec_apps) >= 1
    target_app = next(a for a in rec_apps if a["application_id"] == app_res["id"])
    assert target_app["candidate_email"] == cand_reg.email
    assert target_app["ai_match_score"] >= 60

    # 6. Recruiter Updates Applicant Stage to Interview
    status_update = await update_applicant_status_endpoint(
        app_res["id"],
        payload=UpdateApplicantStatusPayload(new_status="Interview", notes="Passed technical screening"),
        current_user=recruiter_user,
        session=async_session,
    )
    assert status_update["status"] == "Interview"

    # 7. Verify Automated Candidate Notification
    cand_notifs = await get_notifications_endpoint(unread_only=True, current_user=candidate_user, session=async_session)
    assert cand_notifs["unread_count"] >= 1
    assert "Interview" in cand_notifs["notifications"][0]["message"]
