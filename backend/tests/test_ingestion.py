import pytest
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

from app.services.ingestion import ingest_job_listings, purge_expired_jobs
from app.models.job_listing import JobListing
from app.models.job import Job


@pytest.mark.anyio
async def test_ingest_and_duplicate_detection(async_session):
    listing = JobListing(
        company=f"Acme-{uuid.uuid4()}",
        title="Software Engineer",
        location="NY",
        description="Software Engineer with Python skills",
        apply_url=f"https://a.example/apply/{uuid.uuid4()}",
        skills=["python"],
        remote=False,
        published_at=datetime.now(timezone.utc),
    )

    # first ingest
    ingested = await ingest_job_listings([listing], "unit_test", session=async_session)
    assert len(ingested) == 1

    # duplicate by apply_url should be skipped
    ingested2 = await ingest_job_listings([listing], "unit_test", session=async_session)
    assert len(ingested2) == 0


@pytest.mark.anyio
async def test_purge_expired_jobs_3_days(async_session):
    old_date = datetime.now(timezone.utc) - timedelta(days=4)
    listing_old = JobListing(
        company=f"OldCorp-{uuid.uuid4()}",
        title="Legacy Software Developer",
        location="Remote",
        description="Legacy Python Role",
        apply_url=f"https://old.example/apply/{uuid.uuid4()}",
        skills=["python"],
        remote=True,
        published_at=old_date,
    )

    fresh_date = datetime.now(timezone.utc) - timedelta(days=1)
    listing_fresh = JobListing(
        company=f"FreshCorp-{uuid.uuid4()}",
        title="Modern Software Developer",
        location="Remote",
        description="Fresh Python Role",
        apply_url=f"https://fresh.example/apply/{uuid.uuid4()}",
        skills=["python"],
        remote=True,
        published_at=fresh_date,
    )

    await ingest_job_listings([listing_old, listing_fresh], "unit_test_purge", session=async_session)

    # Purge jobs older than 3 days
    purged_count = await purge_expired_jobs(session=async_session, max_age_days=3)
    assert purged_count >= 1
