from __future__ import annotations

import logging
import re
from typing import Iterable, List, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.session import get_async_sessionmaker
from ..models.company import Company
from ..models.job import Job
from ..models.source import Source
from ..models.job_listing import JobListing

logger = logging.getLogger(__name__)


_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _generate_slug(company: str, title: str, location: str) -> str:
    combined = f"{company.strip()} {title.strip()} {location.strip()}".lower()
    slug = _SLUG_RE.sub("-", combined).strip("-")
    return slug[:1024]


def _normalize_apply_url(raw_url: str) -> str:
    return raw_url.strip()


async def ingest_job_listings(
    listings: Iterable[JobListing],
    source_name: str,
    session: Optional[AsyncSession] = None,
) -> List[Job]:
    if session is None:
        sessionmaker = get_async_sessionmaker()
        async with sessionmaker() as session:
            async with session.begin():
                return await _process_listings(session, listings, source_name)

    if not session.in_transaction():
        async with session.begin():
            return await _process_listings(session, listings, source_name)

    return await _process_listings(session, listings, source_name)


async def _process_listings(
    session: AsyncSession,
    listings: Iterable[JobListing],
    source_name: str,
) -> List[Job]:
    source = await _get_or_create_source(session, source_name)
    ingested: List[Job] = []
    seen_urls: set[str] = set()
    seen_slugs: set[str] = set()

    for listing in listings:
        apply_url = _normalize_apply_url(listing.apply_url)
        slug = _generate_slug(listing.company, listing.title, listing.location)

        if apply_url in seen_urls:
            logger.debug("Duplicate listing skipped by apply_url", extra={"apply_url": apply_url})
            continue
        if slug in seen_slugs:
            logger.debug("Duplicate listing skipped by slug", extra={"slug": slug})
            continue

        seen_urls.add(apply_url)
        seen_slugs.add(slug)

        company = await _get_or_create_company(session, listing.company)
        job = Job(
            source_id=source.id,
            company_id=company.id,
            title=listing.title,
            description=listing.description,
            location=listing.location,
            apply_url=apply_url,
            slug=slug,
            skills=listing.skills,
            remote=listing.remote,
            published_at=listing.published_at,
        )

        session.add(job)
        try:
            async with session.begin_nested():
                await session.flush()
        except IntegrityError as exc:
            logger.warning(
                "Job record deduplication conflict detected",
                extra={"apply_url": apply_url, "slug": slug},
            )
            continue

        ingested.append(job)

    logger.info("Ingested %d job listings", len(ingested), extra={"source": source_name})
    return ingested


async def _get_or_create_source(session: AsyncSession, name: str) -> Source:
    result = await session.execute(select(Source).where(Source.name == name))
    source = result.scalars().first()
    if source is None:
        source = Source(name=name)
        session.add(source)
        await session.flush()
        logger.info("Created source record", extra={"source": name})
    return source


async def _get_or_create_company(session: AsyncSession, name: str) -> Company:
    result = await session.execute(select(Company).where(Company.name == name))
    company = result.scalars().first()
    if company is None:
        company = Company(name=name)
        session.add(company)
        await session.flush()
        logger.info("Created company record", extra={"company": name})
    return company
