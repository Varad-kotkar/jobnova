from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import logging
from typing import List
import xml.etree.ElementTree as ET

import httpx

from ..base import BasePlugin, RetryablePluginError
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)


class Plugin(BasePlugin):
    async def collect(self) -> List[JobListing]:
        url = self.config.settings.get("endpoint", "https://weworkremotely.com/remote-jobs.rss")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobNova/1.0"
        }

        logger.info("Fetching WeWorkRemotely jobs RSS", extra={"plugin": self.plugin_name, "url": url})
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                xml_text = response.text
        except Exception as exc:
            logger.exception("WeWorkRemotely request failed", extra={"plugin": self.plugin_name})
            raise RetryablePluginError(f"WeWorkRemotely fetch failed: {exc}") from exc

        listings: List[JobListing] = []
        try:
            root = ET.fromstring(xml_text)
            channel = root.find("channel")
            if channel is None:
                return listings

            for item in channel.findall("item"):
                raw_title = item.findtext("title") or ""
                link = item.findtext("link") or ""
                description = item.findtext("description") or ""
                pub_date_str = item.findtext("pubDate") or ""

                if not raw_title or not link:
                    continue

                # Parse company and title if title is "Company: Title"
                if ":" in raw_title:
                    company, title = raw_title.split(":", 1)
                    company = company.strip()
                    title = title.strip()
                else:
                    company = "WeWorkRemotely"
                    title = raw_title.strip()

                published_at = datetime.now(timezone.utc)
                if pub_date_str:
                    try:
                        published_at = parsedate_to_datetime(pub_date_str)
                    except Exception:
                        pass

                listings.append(
                    JobListing(
                        company=company,
                        title=title,
                        location="Remote",
                        description=description,
                        apply_url=link.strip(),
                        skills=["Remote"],
                        remote=True,
                        published_at=published_at,
                    )
                )
        except Exception as exc:
            logger.exception("Error parsing WeWorkRemotely RSS XML", extra={"plugin": self.plugin_name})
            raise RetryablePluginError(f"XML parse error: {exc}") from exc

        logger.info("WeWorkRemotely collected %d job listings", len(listings), extra={"plugin": self.plugin_name})
        return listings
