import pytest
from fastapi import HTTPException
from app.routers.jobs import get_job_by_id_or_slug


@pytest.mark.anyio
async def test_404_on_missing_route(async_session):
    with pytest.raises(HTTPException):
        await get_job_by_id_or_slug("no-such-slug", session=async_session)
