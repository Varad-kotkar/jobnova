from __future__ import annotations

from dataclasses import dataclass, field
import hashlib
import logging
import re
from typing import Iterable, List, Optional

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.session import get_async_sessionmaker
from ..models.company import Company
from ..models.job import Job
from ..models.source import Source
from ..models.job_listing import JobListing

logger = logging.getLogger(__name__)

import html

_SLUG_RE = re.compile(r"[^a-z0-9]+")

def clean_description_text(raw_text: Optional[str]) -> str:
    if not raw_text:
        return ""
    decoded = html.unescape(html.unescape(raw_text))
    decoded = re.sub(r'<br\s*/?>', '\n', decoded, flags=re.IGNORECASE)
    decoded = re.sub(r'<li\b[^>]*>', '\n• ', decoded, flags=re.IGNORECASE)
    decoded = re.sub(r'</?(p|div|ul|ol|tr|h[1-6])\b[^>]*>', '\n', decoded, flags=re.IGNORECASE)
    clean = re.sub(r'<[^>]+>', ' ', decoded)
    lines = [line.strip() for line in clean.split('\n') if line.strip()]
    res = '\n\n'.join(lines) if lines else clean.strip()
    return res[:15000]

# Salary extraction patterns
_SALARY_PATTERNS = [
    re.compile(r"₹\s*(\d[\d,\.]+)\s*(?:[-–]\s*₹?\s*(\d[\d,\.]+))?\s*(lpa|l\.p\.a|lac|lakh|month|yr|year|p\.a)?", re.I),
    re.compile(r"\$\s*(\d[\d,\.]+)\s*(?:[kK])?\s*(?:[-–]\s*\$?\s*(\d[\d,\.]+)\s*(?:[kK])?)?\s*(\/yr|\/year|\/month|annual|yearly)?", re.I),
]

SPAM_KEYWORDS = [
    "training", "course", "bootcamp", "academy", "registration fee", "pay to apply",
    "course enrollment", "placement training", "become job ready", "demo class",
    "online course", "paid course", "workshop", "seminar", "masterclass"
]

TECH_WHITELIST_KEYWORDS = [
    "python", "java", "data analyst", "data scientist", "ml engineer", "ai engineer",
    "backend", "frontend", "full stack", "fullstack", "devops", "cloud", "cybersecurity",
    "qa", "software engineer", "data analytics", "machine learning", "software developer",
    "data engineering", "data engineer", "ai developer", "system engineer", "site reliability"
]

NON_TECH_REJECT_KEYWORDS = [
    "sales", "marketing", "hr", "human resources", "finance", "teacher", "nurse",
    "driver", "civil", "mechanical", "accountant", "account executive", "customer support",
    "business development", "recruiter", "store manager", "receptionist", "telecaller"
]


def _generate_slug(company: str, title: str, location: str) -> str:
    combined = f"{company.strip()} {title.strip()} {location.strip()}".lower()
    base_slug = _SLUG_RE.sub("-", combined).strip("-")[:180]
    hash_suffix = hashlib.sha256(combined.encode("utf-8")).hexdigest()[:6]
    return f"{base_slug}-{hash_suffix}"


def _compute_duplicate_hash(company: str, title: str, location: str) -> str:
    """SHA-256 of normalized company:title:location for hard deduplication."""
    raw = f"{company.strip().lower()}:{title.strip().lower()}:{location.strip().lower()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _normalize_apply_url(raw_url: str) -> str:
    return raw_url.strip()


def _extract_salary(text: str) -> tuple[Optional[str], Optional[str]]:
    """Extract salary string and currency from job text."""
    for pattern in _SALARY_PATTERNS:
        m = pattern.search(text)
        if m:
            full = m.group(0).strip()
            currency = "INR" if "₹" in full else "USD"
            return full[:200], currency
    return None, None


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


def _is_valid_quality_job(listing: JobListing) -> bool:
    if not listing.company or not listing.title or not listing.apply_url:
        return False
    if not listing.description or not listing.description.strip():
        return False

    title_lower = listing.title.lower()
    content_text = f"{listing.title} {listing.description}".lower()

    for kw in SPAM_KEYWORDS:
        if kw in content_text:
            return False

    for reject_kw in NON_TECH_REJECT_KEYWORDS:
        if reject_kw in title_lower:
            return False

    return any(tech_kw in content_text for tech_kw in TECH_WHITELIST_KEYWORDS)


def _meets_telegram_criteria(listing: JobListing) -> bool:
    loc_lower = (listing.location or "").lower()
    title_lower = (listing.title or "").lower()
    desc_lower = (listing.description or "").lower()
    text_combined = f"{title_lower} {desc_lower}"

    location_match = any(loc in loc_lower for loc in ["pune", "bengaluru", "bangalore", "india"]) or (
        listing.remote and ("india" in loc_lower or "india" in text_combined)
    )
    if not location_match:
        return False

    tg_category_match = any(kw in text_combined for kw in ["python", "data analytics", "data science", "ai", "machine learning", "backend"])
    return tg_category_match


async def _process_listings(
    session: AsyncSession,
    listings: Iterable[JobListing],
    source_name: str,
) -> IngestionStats:
    source = await _get_or_create_source(session, source_name)
    stats = IngestionStats()
    seen_urls: set[str] = set()
    seen_hashes: set[str] = set()

    for listing in listings:
        try:
            if not _is_valid_quality_job(listing):
                logger.info("Skipped non-tech or low-quality listing: %s", getattr(listing, 'title', 'Unknown'))
                continue

            apply_url = _normalize_apply_url(listing.apply_url)
            slug = _generate_slug(listing.company, listing.title, listing.location)
            dup_hash = _compute_duplicate_hash(listing.company, listing.title, listing.location)

            # In-batch deduplication
            if apply_url in seen_urls or dup_hash in seen_hashes:
                stats.duplicates += 1
                logger.debug("Duplicate listing skipped in batch", extra={"apply_url": apply_url})
                continue

            seen_urls.add(apply_url)
            seen_hashes.add(dup_hash)

            company = await _get_or_create_company(session, listing.company)

            # DB-level deduplication via duplicate_hash (hard constraint)
            dup_query = select(Job).where(
                (Job.duplicate_hash == dup_hash) | (Job.apply_url == apply_url)
            )
            result = await session.execute(dup_query)
            existing_job = result.scalars().first()

            # Extract salary from description
            salary_text, currency = _extract_salary(
                f"{listing.title} {listing.description or ''}"
            )

            clean_desc = clean_description_text(listing.description)[:15000]

            if existing_job:
                existing_job.source_id = source.id
                existing_job.company_id = company.id
                existing_job.title = listing.title
                existing_job.description = clean_desc
                existing_job.location = listing.location
                if listing.published_at:
                    if not existing_job.published_at or listing.published_at > existing_job.published_at:
                        existing_job.published_at = listing.published_at
                existing_job.duplicate_hash = dup_hash
                if salary_text:
                    existing_job.salary = salary_text
                    existing_job.currency = currency

                # Explicitly re-evaluate 3-day freshness on record updates
                if existing_job.published_at:
                    from datetime import datetime, timezone, timedelta
                    pub_dt = existing_job.published_at
                    if pub_dt.tzinfo is None:
                        pub_dt = pub_dt.replace(tzinfo=timezone.utc)
                    existing_job.is_active = pub_dt >= (datetime.now(timezone.utc) - timedelta(days=3))

                target_job = existing_job
                stats.updated += 1
                stats.jobs.append(existing_job)
                logger.info("Updated existing job record", extra={"job_id": existing_job.id})
            else:
                new_job = Job(
                    source_id=source.id,
                    company_id=company.id,
                    title=listing.title,
                    description=clean_desc,
                    location=listing.location,
                    apply_url=apply_url,
                    slug=slug,
                    skills=listing.skills,
                    remote=listing.remote,
                    published_at=listing.published_at,
                    duplicate_hash=dup_hash,
                    salary=salary_text,
                    currency=currency,
                )
                session.add(new_job)
                await session.flush()
                target_job = new_job

                stats.inserted += 1
                stats.jobs.append(new_job)
                logger.info("Inserted new job record", extra={"job_id": new_job.id})

                if _meets_telegram_criteria(listing):
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
    if stats.inserted > 0 or stats.updated > 0:
        from ..core.cache import CacheManager
        await CacheManager.delete_pattern("jobs:list:")
        await CacheManager.delete_pattern("jobs:home:")

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
    """Deactivates active job listings older than max_age_days (default 3 days)."""
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    cutoff_date_aware = now - timedelta(days=max_age_days)
    cutoff_date_naive = cutoff_date_aware.replace(tzinfo=None)

    async def _purge(sess: AsyncSession) -> int:
        stmt = select(Job).where(
            Job.is_active == True,
            or_(
                Job.published_at < cutoff_date_aware,
                Job.published_at < cutoff_date_naive,
            ),
        )
        result = await sess.execute(stmt)
        expired_jobs = result.scalars().all()
        deactivated_count = 0
        for job in expired_jobs:
            job.is_active = False
            deactivated_count += 1
        if deactivated_count > 0:
            await sess.commit()
            from ..core.cache import CacheManager
            await CacheManager.delete_pattern("jobs:list:")
            await CacheManager.delete_pattern("jobs:home:")
            logger.info("Purged/Deactivated %d jobs older than %d days and cleared homepage cache.", deactivated_count, max_age_days)
        return deactivated_count

    if session is None:
        sessionmaker = get_async_sessionmaker()
        async with sessionmaker() as session:
            return await _purge(session)
    return await _purge(session)
