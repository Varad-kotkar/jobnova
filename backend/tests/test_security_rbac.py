import uuid
import pytest
from fastapi import HTTPException

from app.core.rbac import require_roles
from app.core.rate_limit import RateLimiter
from app.models.user import User


@pytest.mark.anyio
async def test_rbac_permission_enforcement():
    candidate_user = User(id="c1", email="cand@example.com", full_name="Candidate", role="candidate")
    recruiter_user = User(id="r1", email="rec@example.com", full_name="Recruiter", role="recruiter")
    admin_user = User(id="a1", email="admin@example.com", full_name="Admin", role="admin")

    checker = require_roles("recruiter", "admin")

    # Candidate should fail with 403
    with pytest.raises(HTTPException) as exc_info:
        await checker(current_user=candidate_user)
    assert exc_info.value.status_code == 403

    # Recruiter & Admin should succeed
    res_rec = await checker(current_user=recruiter_user)
    assert res_rec.id == "r1"

    res_admin = await checker(current_user=admin_user)
    assert res_admin.id == "a1"


@pytest.mark.anyio
async def test_rate_limiter():
    RateLimiter.reset()

    # Allow 3 requests
    await RateLimiter.check_rate_limit(key="ip:127.0.0.1", max_requests=3, window_seconds=60)
    await RateLimiter.check_rate_limit(key="ip:127.0.0.1", max_requests=3, window_seconds=60)
    await RateLimiter.check_rate_limit(key="ip:127.0.0.1", max_requests=3, window_seconds=60)

    # 4th request should raise 429
    with pytest.raises(HTTPException) as exc_info:
        await RateLimiter.check_rate_limit(key="ip:127.0.0.1", max_requests=3, window_seconds=60)
    assert exc_info.value.status_code == 429
