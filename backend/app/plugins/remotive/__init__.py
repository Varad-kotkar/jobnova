"""Remotive.io plugin — Official public REST API for remote jobs."""
from datetime import datetime, timezone
import logging
from typing import List

import httpx

from ..base import BasePlugin, RetryablePluginError
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)

# Top categories to fetch from Remotive
REMOTIVE_CATEGORIES = [
    "software-dev",
    "data",
    "devops-sysadmin",
    "product",
    "design",
    "qa",
    "machine-learning",
]


def _parse_date(raw: str | None) -> datetime:
    if not raw:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return datetime.now(timezone.utc)


class Plugin(BasePlugin):
    async def collect(self) -> List[JobListing]:
        listings: List[JobListing] = []
        headers = {"User-Agent": "JobNova/1.0 (job-aggregator; contact@jobnova.com)"}

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for category in REMOTIVE_CATEGORIES:
                try:
                    url = f"https://remotive.com/api/remote-jobs?category={category}&limit=50"
                    resp = await client.get(url, headers=headers)
                    if resp.status_code != 200:
                        logger.warning("Remotive returned %d for category %s", resp.status_code, category)
                        continue

                    data = resp.json()
                    jobs = data.get("jobs", [])

                    for item in jobs:
                        title = item.get("title", "")
                        company = item.get("company_name", "")
                        apply_url = item.get("url", "")
                        location = item.get("candidate_required_location") or item.get("company_country") or "Remote"
                        description = item.get("description", "") or f"{title} at {company}"
                        published_raw = item.get("publication_date")
                        tags = item.get("tags") or []

                        if not title or not apply_url or not company:
                            continue

                        listings.append(
                            JobListing(
                                company=company,
                                title=title,
                                location=location,
                                description=description[:5000],
                                apply_url=apply_url,
                                skills=tags[:10] if isinstance(tags, list) else ["Remote", "Tech"],
                                remote=True,
                                published_at=_parse_date(published_raw),
                            )
                        )
                except Exception as exc:
                    logger.warning("Remotive fetch error for category %s: %s", category, exc)
                    continue

        logger.info("Remotive collected %d listings", len(listings))
        return listings
