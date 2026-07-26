import pytest
from fastapi import HTTPException

from app.core.rbac import require_verified_recruiter
from app.models.recruiter import RecruiterProfile
from app.models.user import User
from app.routers.admin import update_recruiter_status, UpdateRecruiterStatusPayload, list_recruiters
from app.routers.recruiter import create_recruiter_job_endpoint, CreateRecruiterJobPayload


@pytest.mark.anyio
async def test_recruiter_verification_lifecycle(async_session):
    # 1. Create Users
    candidate = User(email="cand@test.com", full_name="Candidate User", role="candidate")
    recruiter_user = User(email="recruiter@test.com", full_name="Pending Recruiter", role="recruiter")
    admin_user = User(email="admin@test.com", full_name="System Admin", role="admin")

    async_session.add_all([candidate, recruiter_user, admin_user])
    await async_session.commit()

    # 2. Create pending RecruiterProfile
    recruiter_profile = RecruiterProfile(
        user_id=recruiter_user.id,
        verification_status="pending",
        job_title="Talent Director",
        company_website="https://acme.com",
    )
    async_session.add(recruiter_profile)
    await async_session.commit()

    # STEP A: Candidate attempts require_verified_recruiter -> 403 Forbidden
    with pytest.raises(HTTPException) as exc_cand:
        await require_verified_recruiter(current_user=candidate, session=async_session)
    assert exc_cand.value.status_code == 403

    # STEP B: Pending Recruiter attempts require_verified_recruiter -> 403 Forbidden
    with pytest.raises(HTTPException) as exc_pending:
        await require_verified_recruiter(current_user=recruiter_user, session=async_session)
    assert exc_pending.value.status_code == 403
    assert "Recruiter verification required" in str(exc_pending.value.detail)

    # STEP C: Admin lists pending recruiters
    pending_res = await list_recruiters(status_filter="pending", current_user=admin_user, session=async_session)
    assert len(pending_res["data"]) == 1
    assert pending_res["data"][0]["id"] == recruiter_profile.id

    # STEP D: Admin approves recruiter profile
    approve_res = await update_recruiter_status(
        recruiter_id=recruiter_profile.id,
        payload=UpdateRecruiterStatusPayload(status="approved", reason="Verified domain"),
        current_user=admin_user,
        session=async_session,
    )
    assert approve_res["success"] is True
    assert approve_res["data"]["verification_status"] == "approved"

    # STEP E: Verify recruiter is now approved via require_verified_recruiter dependency
    verified_user = await require_verified_recruiter(current_user=recruiter_user, session=async_session)
    assert verified_user.id == recruiter_user.id

    # STEP F: Approved recruiter posts job -> 201 Created
    job_payload = CreateRecruiterJobPayload(
        title="Staff Distributed Systems Architect",
        description="Build high scale distributed cloud systems in Rust and Python.",
        company_name="Acme Inc",
        location="Remote",
        remote=True,
        skills=["Python", "FastAPI", "Rust"],
    )
    posted_job = await create_recruiter_job_endpoint(job_payload, current_user=recruiter_user, session=async_session)
    assert posted_job["title"] == "Staff Distributed Systems Architect"
    assert posted_job["company"] == "Acme Inc"

    # STEP G: Admin suspends recruiter profile
    suspend_res = await update_recruiter_status(
        recruiter_id=recruiter_profile.id,
        payload=UpdateRecruiterStatusPayload(status="suspended", reason="Fraud audit"),
        current_user=admin_user,
        session=async_session,
    )
    assert suspend_res["data"]["verification_status"] == "suspended"

    # STEP H: Suspended recruiter attempts require_verified_recruiter -> 403 Forbidden
    with pytest.raises(HTTPException) as exc_suspended:
        await require_verified_recruiter(current_user=recruiter_user, session=async_session)
    assert exc_suspended.value.status_code == 403
