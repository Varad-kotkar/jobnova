from datetime import datetime, timezone
import logging
from typing import Any, Dict, List

import httpx

from ..base import BasePlugin, RetryablePluginError
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)

DEFAULT_COMPANIES = ["vercel", "cloudflare", "postman"]


class Plugin(BasePlugin):
    async def collect(self) -> List[JobListing]:
        companies_str = self.config.settings.get("companies")
        if companies_str and isinstance(companies_str, str):
            companies = [c.strip() for c in companies_str.split(",") if c.strip()]
        else:
            companies = DEFAULT_COMPANIES

        listings: List[JobListing] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobNova/1.0"
        }

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            for company in companies:
                url = f"https://api.lever.co/v0/postings/{company}?mode=json"
                try:
                    logger.info("Fetching Lever jobs for company", extra={"company": company, "url": url})
                    response = await client.get(url, headers=headers)
                    if response.status_code != 200:
                        logger.warning("Lever returned non-200 for company %s: %d", company, response.status_code)
                        continue
                    
                    data = response.json()
                    if not isinstance(data, list):
                        continue

                    for item in data:
                        if not isinstance(item, dict):
                            continue
                        title = item.get("text")
                        apply_url = item.get("hostedUrl") or item.get("applyUrl")
                        if not title or not apply_url:
                            continue

                        categories = item.get("categories") or {}
                        location = categories.get("location") or "Remote"
                        team = categories.get("team") or ""
                        skills = [team] if team else []

                        created_at_ms = item.get("createdAt")
                        if created_at_ms and isinstance(created_at_ms, (int, float)):
                            published_at = datetime.fromtimestamp(created_at_ms / 1000.0, tz=timezone.utc)
                        else:
                            published_at = datetime.now(timezone.utc)

                        is_remote = "remote" in location.lower() or "remote" in title.lower()

                        listings.append(
                            JobListing(
                                company=company.capitalize(),
                                title=title,
                                location=location,
                                description=item.get("descriptionPlain") or item.get("description") or f"{title} at {company}",
                                apply_url=apply_url,
                                skills=skills,
                                remote=is_remote,
                                published_at=published_at,
                            )
                        )
                except Exception as exc:
                    logger.warning("Error fetching Lever jobs for %s: %s", company, exc)
                    continue

        logger.info("Lever collected %d job listings", len(listings), extra={"plugin": self.plugin_name})
        return listings
