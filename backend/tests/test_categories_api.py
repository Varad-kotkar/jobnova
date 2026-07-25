import uuid
from datetime import datetime, timezone
import pytest
from fastapi import HTTPException

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.services.category_classifier import CategoryClassifier
from app.routers.categories import list_categories, get_category_by_slug, list_jobs_by_category


@pytest.mark.anyio
async def test_category_classification_and_api(async_session):
    unique_suffix = str(uuid.uuid4())[:8]
    company = Company(name=f"Google-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")

    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Senior React Frontend Developer",
        description="Building Next.js and TypeScript interfaces",
        location="Remote",
        apply_url=f"https://google.example/apply/{unique_suffix}",
        slug=f"google-frontend-{unique_suffix}",
        skills=["react", "typescript", "next.js"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )

    async_session.add(job1)
    await async_session.flush()

    # Test classifier
    matched = await CategoryClassifier.classify_and_assign(async_session, job1)
    await async_session.commit()
    assert len(matched) >= 1

    # List categories
    categories = await list_categories(search=None, sort="jobs", session=async_session)
    assert len(categories) >= 1

    # Get frontend-development category
    cat_detail = await get_category_by_slug("frontend-development", session=async_session)
    assert cat_detail["slug"] == "frontend-development"

    # Get category jobs
    jobs_response = await list_jobs_by_category("frontend-development", page=1, page_size=25, sort_by="newest", session=async_session)
    assert len(jobs_response.items) >= 1


@pytest.mark.anyio
async def test_category_not_found(async_session):
    with pytest.raises(HTTPException) as exc_info:
        await get_category_by_slug("non-existent-category-slug-999", session=async_session)
    assert exc_info.value.status_code == 404
