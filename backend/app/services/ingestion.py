from __future__ import annotations

from dataclasses import dataclass, field
import logging
import re
from typing import Iterable, List, Optional

from sqlalchemy import select
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


@dataclass
class IngestionStats:
    inserted: int = 0
    updated: int = 0
    duplicates: int = 0
    errors: List[str] = field(default_factory=list)
    jobs: List[Job] = field(default_factory=list)

    def __len__(self) -> int:
        return self.inserted

    def __iter__(self):
        return iter(self.jobs)


async def ingest_job_listings(
    listings: Iterable[JobListing],
    source_name: str,
    session: Optional[AsyncSession] = None,
) -> IngestionStats:
    if session is None:
        sessionmaker = get_async_sessionmaker()
        async with sessionmaker() as session:
            async with session.begin():
                return await _process_listings(session, listings, source_name)

    return await _process_listings(session, listings, source_name)


async def _process_listings(
    session: AsyncSession,
    listings: Iterable[JobListing],
    source_name: str,
) -> IngestionStats:
    source = await _get_or_create_source(session, source_name)
    stats = IngestionStats()
    seen_urls: set[str] = set()
    seen_slugs: set[str] = set()

    for listing in listings:
        try:
            apply_url = _normalize_apply_url(listing.apply_url)
            slug = _generate_slug(listing.company, listing.title, listing.location)

            if apply_url in seen_urls or slug in seen_slugs:
                stats.duplicates += 1
                logger.debug("Duplicate listing skipped in batch", extra={"apply_url": apply_url, "slug": slug})
                continue

            seen_urls.add(apply_url)
            seen_slugs.add(slug)

            company = await _get_or_create_company(session, listing.company)

            # Check if job already exists in database (UPSERT logic)
            query = select(Job).where((Job.apply_url == apply_url) | (Job.slug == slug))
            result = await session.execute(query)
            existing_job = result.scalars().first()

            if existing_job:
                # Update existing job fields
                existing_job.source_id = source.id
                existing_job.company_id = company.id
                existing_job.title = listing.title
                existing_job.description = listing.description
                existing_job.location = listing.location
                existing_job.skills = listing.skills
                existing_job.remote = listing.remote
                existing_job.published_at = listing.published_at
                
                stats.updated += 1
                stats.jobs.append(existing_job)
                logger.info("Updated existing job record", extra={"job_id": existing_job.id, "apply_url": apply_url})
            else:
                new_job = Job(
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
                session.add(new_job)
                await session.flush()

                stats.inserted += 1
                stats.jobs.append(new_job)
                logger.info("Inserted new job record", extra={"job_id": new_job.id, "apply_url": apply_url})

        except Exception as exc:
            err_msg = f"Failed to ingest listing '{getattr(listing, 'title', 'Unknown')}': {exc}"
            logger.exception("Error during job listing ingestion", extra={"source": source_name})
            stats.errors.append(err_msg)

    logger.info(
        "Ingestion completed for source %s: inserted=%d, updated=%d, duplicates=%d, errors=%d",
        source_name,
        stats.inserted,
        stats.updated,
        stats.duplicates,
        len(stats.errors),
    )
    return stats


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
