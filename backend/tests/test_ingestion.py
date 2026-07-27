import pytest
import uuid
from datetime import datetime, timezone

from app.services.ingestion import ingest_job_listings
from app.models.job_listing import JobListing
from app.models.company import Company
from app.models.source import Source


@pytest.mark.anyio
async def test_ingest_and_duplicate_detection(async_session):
    listing = JobListing(
        company=f"Acme-{uuid.uuid4()}",
        title="Software Engineer",
        location="NY",
        description="Software Engineer with Python skills",
        apply_url="https://a.example/apply/dup",
        skills=["python"],
        remote=False,
        published_at=datetime.now(timezone.utc),
    )

    # first ingest
    ingested = await ingest_job_listings([listing], "unit_test", session=async_session)
    assert len(ingested) == 1

    # duplicate by apply_url should be skipped
    ingested2 = await ingest_job_listings([listing, listing], "unit_test", session=async_session)
    assert len(ingested2) == 0
