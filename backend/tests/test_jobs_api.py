import pytest
from datetime import datetime, timezone

import uuid

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.jobs import list_jobs, get_job
from fastapi import HTTPException


@pytest.mark.anyio
async def test_jobs_list_and_filters(async_session):
    # insert company and source
    company = Company(name=f"Acme-{uuid.uuid4()}")
    source = Source(name=f"test_source-{uuid.uuid4()}")
    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Engineer",
        description="Work",
        location="NYC",
        apply_url="https://a.example/apply/1",
        slug="acme-engineer-nyc",
        skills=["python"],
        remote=False,
        published_at=datetime.now(timezone.utc),
    )
    job2 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Senior Engineer",
        description="Work more",
        location="Remote",
        apply_url="https://a.example/apply/2",
        slug="acme-senior-engineer-remote",
        skills=["python", "aws"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )

    # persist company and source first to ensure ids are populated
    async_session.add_all([company, source])
    await async_session.flush()

    job1.source_id = source.id
    job1.company_id = company.id
    job2.source_id = source.id
    job2.company_id = company.id

    async_session.add_all([job1, job2])
    await async_session.commit()

    # list all via router function
    result = await list_jobs(page=1, page_size=25, keyword=None, company=None, location=None, remote=None, session=async_session)
    assert result.total == 2

    # filter by remote
    result = await list_jobs(page=1, page_size=25, keyword=None, company=None, location=None, remote=True, session=async_session)
    assert result.total == 1

    # pagination
    result = await list_jobs(page=1, page_size=1, keyword=None, company=None, location=None, remote=None, session=async_session)
    assert result.page_size == 1


@pytest.mark.anyio
async def test_get_job_not_found(async_session):
    with pytest.raises(HTTPException):
        await get_job("non-existent-slug", session=async_session)
