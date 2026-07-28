"""YC Jobs / Work at a Startup plugin — Fetches YC startup jobs."""
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
        """Fetches jobs from the YC job board public API (workatastartup.com)."""
        listings: List[JobListing] = []
        headers = {
            "User-Agent": "JobNova/1.0",
            "Accept": "application/json",
        }

        # YC's public job API endpoint (JSON)
        url = "https://www.workatastartup.com/jobs.json"

        try:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.warning("YC jobs API returned %d", resp.status_code)
                    return listings

                data = resp.json()
                jobs = data if isinstance(data, list) else data.get("jobs", [])

                for item in jobs:
                    title = item.get("title") or item.get("role", "")
                    company = item.get("company") or item.get("company_name", "")
                    apply_url = item.get("url") or item.get("apply_url", "")
                    location = item.get("location") or item.get("locations") or "Remote (Global)"
                    if isinstance(location, list):
                        location = ", ".join(str(l) for l in location)
                    description = item.get("description") or f"{title} at {company} (YC-backed startup)"
                    skills = item.get("skills") or item.get("tags") or []
                    published_at = _parse_date(item.get("created_at") or item.get("published_at"))
                    is_remote = "remote" in str(location).lower()

                    if not title or not apply_url:
                        continue

                    listings.append(
                        JobListing(
                            company=str(company) or "YC Startup",
                            title=title,
                            location=str(location),
                            description=str(description)[:5000],
                            apply_url=apply_url,
                            skills=skills[:10] if isinstance(skills, list) else [],
                            remote=is_remote,
                            published_at=published_at,
                        )
                    )
        except Exception as exc:
            logger.warning("YC Jobs fetch error: %s", exc)

        logger.info("YC Jobs collected %d listings", len(listings))
        return listings
