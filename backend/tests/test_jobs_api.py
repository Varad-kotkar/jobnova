import pytest
from datetime import datetime, timezone

import uuid

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.jobs import list_jobs, get_job_by_id_or_slug
from fastapi import HTTPException


@pytest.mark.anyio
async def test_jobs_list_and_filters(async_session):
    company = Company(name=f"Acme-{uuid.uuid4()}")
    source = Source(name=f"test_source-{uuid.uuid4()}")
    
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Engineer",
        description="Work with Python and FastAPI",
        location="NYC",
        apply_url=f"https://a.example/apply/{uuid.uuid4()}",
        slug=f"acme-engineer-nyc-{uuid.uuid4()}",
        skills=["python"],
        remote=False,
        published_at=datetime.now(timezone.utc),
    )
    job2 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Senior Engineer",
        description="Work with React and TypeScript",
        location="Remote",
        apply_url=f"https://a.example/apply/{uuid.uuid4()}",
        slug=f"acme-senior-engineer-remote-{uuid.uuid4()}",
        skills=["python", "aws"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )

    async_session.add_all([job1, job2])
    await async_session.commit()

    # List all
    result = await list_jobs(page=1, page_size=25, keyword=None, company=None, location=None, remote=None, sort_by="newest", session=async_session)
    assert result.pagination.total >= 2
    assert result.pagination.page == 1
    assert result.pagination.has_previous is False

    # Filter by remote
    result = await list_jobs(page=1, page_size=25, keyword=None, company=None, location=None, remote=True, sort_by="newest", session=async_session)
    assert len(result.items) >= 1
    assert all(item.remote for item in result.items)

    # Filter by keyword (relevance)
    result = await list_jobs(page=1, page_size=25, keyword="React", company=None, location=None, remote=None, sort_by="relevance", session=async_session)
    assert len(result.items) >= 1
    assert "React" in result.items[0].description


@pytest.mark.anyio
async def test_get_job_not_found(async_session):
    with pytest.raises(HTTPException):
        await get_job_by_id_or_slug("non-existent-slug", session=async_session)
