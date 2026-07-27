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


SPAM_KEYWORDS = [
    "training", "course", "bootcamp", "academy", "registration fee", "pay to apply",
    "course enrollment", "placement training", "become job ready", "demo class",
    "online course", "paid course", "workshop", "seminar", "masterclass"
]


def _is_valid_quality_job(listing: JobListing) -> bool:
    if not listing.company or not listing.title or not listing.apply_url:
        return False
    if not listing.description or not listing.description.strip():
        return False

    content_text = f"{listing.title} {listing.description}".lower()
    for kw in SPAM_KEYWORDS:
        if kw in content_text:
            return False
    return True


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
            if not _is_valid_quality_job(listing):
                logger.info("Skipped low-quality or spam listing: %s", getattr(listing, 'title', 'Unknown'))
                continue

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
                
                target_job = existing_job
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
                target_job = new_job

                stats.inserted += 1
                stats.jobs.append(new_job)
                logger.info("Inserted new job record", extra={"job_id": new_job.id, "apply_url": apply_url})

                # Asynchronously post new job listing to Telegram Channel
                try:
                    import asyncio
                    from .telegram_service import TelegramService
                    asyncio.create_task(TelegramService.post_job_to_channel({
                        "id": new_job.id,
                        "title": new_job.title,
                        "company": company.name if company else "Company",
                        "location": new_job.location,
                        "remote": new_job.remote,
                        "slug": new_job.slug,
                        "apply_url": new_job.apply_url,
                    }))
                except Exception as tg_err:
                    logger.warning("Telegram async broadcast error: %s", tg_err)

            from .category_classifier import CategoryClassifier
            await CategoryClassifier.classify_and_assign(session, target_job)


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
    clean_name = name.strip()
    result = await session.execute(select(Company).where(Company.name == clean_name))
    company = result.scalars().first()
    if company is None:
        cleaned_slug = re.sub(r"[^\w\s-]", "", clean_name.lower())
        company_slug = re.sub(r"[-\s]+", "-", cleaned_slug).strip("-") or "company"
        company = Company(
            name=clean_name,
            slug=company_slug,
            website=f"https://{company_slug}.com",
            industry="Technology",
            size="100-1,000 employees",
            headquarters="San Francisco, CA",
        )
        session.add(company)
        await session.flush()
        logger.info("Created company record", extra={"company": clean_name, "slug": company_slug})
    return company


async def purge_expired_jobs(session: Optional[AsyncSession] = None, max_age_days: int = 3) -> int:
    """Deactivates active job listings that are older than max_age_days."""
    from datetime import datetime, timezone, timedelta
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=max_age_days)

    async def _purge(sess: AsyncSession) -> int:
        stmt = select(Job).where(Job.is_active == True, Job.published_at < cutoff_date)
        result = await sess.execute(stmt)
        expired_jobs = result.scalars().all()
        deactivated_count = 0
        for job in expired_jobs:
            job.is_active = False
            deactivated_count += 1
        if deactivated_count > 0:
            await sess.commit()
            logger.info("Purged/Deactivated %d jobs older than %d days.", deactivated_count, max_age_days)
        return deactivated_count

    if session is None:
        sessionmaker = get_async_sessionmaker()
        async with sessionmaker() as session:
            return await _purge(session)
    return await _purge(session)

