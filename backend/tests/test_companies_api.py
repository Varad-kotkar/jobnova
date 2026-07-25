import uuid
from datetime import datetime, timezone
import pytest
from fastapi import HTTPException

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.companies import list_companies, get_company_by_slug


@pytest.mark.anyio
async def test_companies_listing_search_and_sorting(async_session):
    unique_suffix = str(uuid.uuid4())[:8]
    company_name = f"Stripe-{unique_suffix}"
    company_slug = f"stripe-{unique_suffix}"
    company = Company(
        name=company_name,
        slug=company_slug,
        website=f"https://{company_slug}.com",
        industry="Financial Services",
        size="1,000-5,000 employees",
        headquarters="San Francisco, CA",
    )
    source = Source(name=f"test_source-{unique_suffix}")

    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Backend Engineer",
        description="Rust development",
        location="San Francisco, CA",
        apply_url=f"https://stripe.example/apply/{unique_suffix}",
        slug=f"stripe-backend-{unique_suffix}",
        skills=["rust", "go"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )

    async_session.add_all([job1])
    await async_session.commit()

    # List all companies
    companies = await list_companies(search=None, keyword=None, sort="jobs", session=async_session)
    assert len(companies) >= 1
    stripe_item = next((c for c in companies if c["name"] == company_name), None)
    assert stripe_item is not None
    assert stripe_item["active_jobs"] >= 1
    assert stripe_item["remote_jobs"] >= 1

    # Search company
    search_results = await list_companies(search="Stripe", keyword=None, sort="name", session=async_session)
    assert len(search_results) >= 1

    # Get by slug (direct indexed database query)
    company_detail = await get_company_by_slug(company_slug, session=async_session)
    assert company_detail["name"] == company_name
    assert company_detail["slug"] == company_slug
    assert len(company_detail["jobs"]) >= 1


@pytest.mark.anyio
async def test_company_not_found_404(async_session):
    with pytest.raises(HTTPException) as exc_info:
        await get_company_by_slug("non-existent-company-slug-123456", session=async_session)
    assert exc_info.value.status_code == 404
