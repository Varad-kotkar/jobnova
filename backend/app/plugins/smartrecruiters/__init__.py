"""SmartRecruiters plugin — Public SmartRecruiters ATS API."""
from datetime import datetime, timezone
import logging
from typing import List

import httpx

from ..base import BasePlugin
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)

# Tech companies on SmartRecruiters
DEFAULT_COMPANIES = [
    "IQVIA", "Bosch", "Siemens", "Zalando", "Wayfair",
    "Klarna", "Criteo", "Deezer", "BlaBlaCar",
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
        companies_str = settings.get("companies")
        companies = [c.strip() for c in companies_str.split(",") if c.strip()] if companies_str else DEFAULT_COMPANIES

        listings: List[JobListing] = []
        headers = {"User-Agent": "JobNova/1.0"}

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for company_id in companies:
                try:
                    url = f"https://api.smartrecruiters.com/v1/companies/{company_id}/postings"
                    resp = await client.get(url, headers=headers, params={"limit": 50, "offset": 0})
                    if resp.status_code != 200:
                        continue

                    data = resp.json()
                    jobs = data.get("content", [])

                    for item in jobs:
                        title = item.get("name", "")
                        job_id = item.get("id", "")
                        apply_url = item.get("ref") or f"https://jobs.smartrecruiters.com/{company_id}/{job_id}"
                        loc = item.get("location") or {}
                        location = f"{loc.get('city', '')}, {loc.get('country', '')}".strip(", ") or "Remote"
                        department = (item.get("department") or {}).get("label", "")
                        published_at = _parse_date(item.get("releasedDate") or item.get("createDate"))
                        is_remote = item.get("workplaceType") == "REMOTE"

                        if not title or not job_id:
                            continue

                        listings.append(
                            JobListing(
                                company=company_id,
                                title=title,
                                location=location,
                                description=f"{title} — {department} at {company_id}",
                                apply_url=apply_url,
                                skills=[department] if department else ["Tech"],
                                remote=is_remote,
                                published_at=published_at,
                            )
                        )
                except Exception as exc:
                    logger.warning("SmartRecruiters fetch error for %s: %s", company_id, exc)
                    continue

        logger.info("SmartRecruiters collected %d listings", len(listings))
        return listings
