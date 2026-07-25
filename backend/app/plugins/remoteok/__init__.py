from datetime import datetime, timezone
import logging
from typing import Any, Dict, List

import httpx

from ..base import BasePlugin, RetryablePluginError
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)


class Plugin(BasePlugin):
    async def collect(self) -> List[JobListing]:
        url = self.config.settings.get("endpoint", "https://remoteok.com/api")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobNova/1.0"
        }

        logger.info("Fetching RemoteOK jobs", extra={"plugin": self.plugin_name, "url": url})
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            logger.exception("RemoteOK request failed", extra={"plugin": self.plugin_name})
            raise RetryablePluginError(f"RemoteOK fetch failed: {exc}") from exc

        if not isinstance(data, list):
            logger.warning("RemoteOK returned invalid data format", extra={"plugin": self.plugin_name})
            return []

        listings: List[JobListing] = []
        for item in data:
            if not isinstance(item, dict):
                continue
            
            title = item.get("position")
            company = item.get("company")
            apply_url = item.get("url") or item.get("apply_url")
            if not title or not company or not apply_url:
                continue

            description = item.get("description") or f"{title} position at {company}"
            location = item.get("location") or "Remote"
            tags = item.get("tags") or []
            skills = [str(t).strip() for t in tags if t]

            # Parse date
            raw_date = item.get("date")
            published_at = datetime.now(timezone.utc)
            if raw_date:
                try:
                    published_at = datetime.fromisoformat(str(raw_date).replace("Z", "+00:00"))
                except ValueError:
                    pass

            listings.append(
                JobListing(
                    company=company,
                    title=title,
                    location=location,
                    description=description,
                    apply_url=apply_url,
                    skills=skills,
                    remote=True,
                    published_at=published_at,
                )
            )

        logger.info("RemoteOK collected %d job listings", len(listings), extra={"plugin": self.plugin_name})
        return listings
