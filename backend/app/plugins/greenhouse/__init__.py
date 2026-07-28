from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

import httpx

from ..base import BasePlugin, RetryablePluginError
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)

DEFAULT_BOARDS = [
    # Original boards
    "gitlab", "stripe", "airtable", "datadog", "figma", "notion",
    "hashicorp", "doordash", "discord", "brex", "affirm", "gusto",
    "rubrik", "cohere", "ramp", "elastic", "mongodb", "twosigma",
    # Expanded boards — India-hiring and global remote tech companies
    "anthropic", "openai", "scale-ai", "mistral", "deepmind",
    "databricks", "snowflake", "confluent", "dbt-labs", "airbyte",
    "vercel", "planetscale", "supabase", "neon", "cloudflare",
    "digitalocean", "twilio", "sendgrid", "segment", "mixpanel",
    "amplitude", "grafana", "pagerduty", "atlassian", "hubspot",
    "zendesk", "intercom", "freshworks", "chargebee", "razorpay",
    "zepto", "swiggy", "dunzo", "browserstack", "postman",
    "moengage", "clevertap", "limelight-networks", "sarvam",
]



def _normalize_location(location_data: Any) -> str:
    if isinstance(location_data, dict):
        return location_data.get("name") or "Remote"
    if isinstance(location_data, str) and location_data.strip():
        return location_data.strip()
    return "Remote"


def _parse_iso_datetime(raw_value: Optional[str]) -> datetime:
    if not raw_value:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return datetime.now(timezone.utc)


class Plugin(BasePlugin):
    async def collect(self) -> List[JobListing]:
        settings = self.config.settings or {}
        endpoint = settings.get("endpoint")
        
        boards_str = settings.get("boards")
        if boards_str and isinstance(boards_str, str):
            boards = [b.strip() for b in boards_str.split(",") if b.strip()]
        else:
            boards = DEFAULT_BOARDS

        listings: List[JobListing] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobNova/1.0"
        }

        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            if endpoint and isinstance(endpoint, str):
                endpoints_to_fetch = [(endpoint, "Greenhouse")]
            else:
                endpoints_to_fetch = [
                    (f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true", board.capitalize())
                    for board in boards
                ]

            for url, company_name in endpoints_to_fetch:
                try:
                    logger.info("Fetching Greenhouse jobs", extra={"plugin": self.plugin_name, "url": url})
                    response = await client.get(url, headers=headers)
                    if response.status_code != 200:
                        logger.warning("Greenhouse returned status %d for %s", response.status_code, url)
                        continue

                    payload = response.json()
                    jobs = payload.get("jobs") if isinstance(payload, dict) else payload
                    if not isinstance(jobs, list):
                        continue

                    for item in jobs:
                        if not isinstance(item, dict):
                            continue

                        title = item.get("title")
                        apply_url = item.get("absolute_url") or item.get("apply_url")
                        if not title or not apply_url:
                            continue

                        location = _normalize_location(item.get("location"))
                        published_at = _parse_iso_datetime(item.get("updated_at") or item.get("created_at"))
                        is_remote = "remote" in location.lower() or "remote" in title.lower()
                        
                        content = item.get("content") or item.get("description") or f"{title} position"

                        listings.append(
                            JobListing(
                                company=company_name,
                                title=title,
                                location=location,
                                description=content,
                                apply_url=apply_url,
                                skills=["Tech"],
                                remote=is_remote,
                                published_at=published_at,
                            )
                        )
                except Exception as exc:
                    logger.warning("Failed to collect Greenhouse jobs from %s: %s", url, exc)
                    continue

        logger.info("Greenhouse collected %d job listings", len(listings), extra={"plugin": self.plugin_name})
        return listings
