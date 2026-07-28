"""Workable plugin — Public Workable ATS API for job listings."""
from datetime import datetime, timezone
import logging
from typing import List

import httpx

from ..base import BasePlugin
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)

# Known Workable company slugs (active tech hirers)
DEFAULT_SLUGS = [
    "skroutz", "taxfix", "deliveryhero", "contentful", "solarisbank",
    "n26", "wefox", "mambu", "sumup", "personio", "babbel",
    "homeday", "omio", "getyourguide", "idealo", "trivago",
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
        settings = self.config.settings or {}
        slugs_str = settings.get("slugs")
        slugs = [s.strip() for s in slugs_str.split(",") if s.strip()] if slugs_str else DEFAULT_SLUGS

        listings: List[JobListing] = []
        headers = {"User-Agent": "JobNova/1.0 (job-aggregator)"}

        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            for slug in slugs:
                try:
                    url = f"https://apply.workable.com/api/v3/accounts/{slug}/jobs"
                    resp = await client.get(url, headers=headers, params={"limit": 50, "offset": 0})
                    if resp.status_code != 200:
                        continue

                    data = resp.json()
                    jobs = data.get("results", data.get("jobs", []))

                    for item in jobs:
                        title = item.get("title", "")
                        apply_url = f"https://apply.workable.com/{slug}/j/{item.get('shortcode', '')}"
                        location_data = item.get("location") or {}
                        if isinstance(location_data, dict):
                            loc_parts = [
                                location_data.get("city", ""),
                                location_data.get("country", ""),
                            ]
                            location = ", ".join(p for p in loc_parts if p) or "Remote"
                        else:
                            location = str(location_data) or "Remote"

                        department = item.get("department", "")
                        description = item.get("description") or item.get("full_description") or f"{title} — {department}"
                        published_at = _parse_date(item.get("created_at") or item.get("published_on"))
                        is_remote = bool(item.get("remote"))

                        if not title or not item.get("shortcode"):
                            continue

                        listings.append(
                            JobListing(
                                company=slug.capitalize(),
                                title=title,
                                location=location,
                                description=str(description)[:5000],
                                apply_url=apply_url,
                                skills=[department] if department else ["Tech"],
                                remote=is_remote,
                                published_at=published_at,
                            )
                        )
                except Exception as exc:
                    logger.warning("Workable fetch error for slug %s: %s", slug, exc)
                    continue

        logger.info("Workable collected %d listings", len(listings))
        return listings
