"""Himalayas.app plugin — Official public Jobs API."""
from datetime import datetime, timezone
import logging
from typing import List

import httpx

from ..base import BasePlugin
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)


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
        headers = {"User-Agent": "JobNova/1.0 (+https://jobnova.app)"}

        # Himalayas provides a public JSON API
        url = "https://himalayas.app/jobs/api?limit=100"

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.warning("Himalayas API returned %d", resp.status_code)
                    return listings

                data = resp.json()
                jobs = data.get("jobs", data if isinstance(data, list) else [])

                for item in jobs:
                    title = item.get("title") or item.get("job_title", "")
                    company = (
                        item.get("companyName")
                        or item.get("company_name")
                        or item.get("company", {}).get("name", "")
                    )
                    apply_url = item.get("applicationUrl") or item.get("url") or item.get("apply_url", "")
                    location = item.get("location") or item.get("locationRestrictions") or "Remote"
                    if isinstance(location, list):
                        location = ", ".join(location)
                    description = item.get("description") or item.get("summary") or f"{title} at {company}"
                    skills = item.get("skills") or item.get("tags") or []
                    published_at = _parse_date(item.get("publishedAt") or item.get("created_at"))

                    if not title or not apply_url or not company:
                        continue

                    listings.append(
                        JobListing(
                            company=str(company),
                            title=title,
                            location=str(location),
                            description=str(description)[:5000],
                            apply_url=apply_url,
                            skills=skills[:10] if isinstance(skills, list) else [],
                            remote=True,
                            published_at=published_at,
                        )
                    )
        except Exception as exc:
            logger.warning("Himalayas fetch error: %s", exc)

        logger.info("Himalayas collected %d listings", len(listings))
        return listings
