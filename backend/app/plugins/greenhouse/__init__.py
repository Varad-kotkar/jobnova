import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from ..base import BasePlugin, PluginConfig, RetryablePluginError
from ...models.job_listing import JobListing

logger = logging.getLogger(__name__)


def _normalize_location(job_data: Dict[str, Any]) -> str:
    office = job_data.get("office") or {}
    city = office.get("name") or ""
    state = office.get("region") or ""
    if city and state:
        return f"{city}, {state}"
    return city or state or "Remote"


def _normalize_skills(job_data: Dict[str, Any]) -> List[str]:
    skills = job_data.get("skills") or []
    return [skill.strip() for skill in skills if isinstance(skill, str)]


def _parse_iso_datetime(raw_value: Optional[str]) -> Optional[datetime]:
    if not raw_value:
        return None
    try:
        return datetime.fromisoformat(raw_value)
    except ValueError:
        return None


class Plugin(BasePlugin):
    async def collect(self) -> List[JobListing]:
        settings = self.config.settings or {}
        endpoint = settings.get("endpoint")
        if not endpoint or not isinstance(endpoint, str):
            raise RetryablePluginError("Greenhouse plugin requires a valid endpoint URL")

        logger.info("Fetching Greenhouse jobs", extra={"plugin": self.plugin_name, "endpoint": endpoint})
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(endpoint)
                response.raise_for_status()
            except httpx.RequestError as exc:
                logger.exception("Greenhouse network request failed", extra={"plugin": self.plugin_name, "endpoint": endpoint})
                raise RetryablePluginError("Greenhouse network request failed") from exc
            except httpx.HTTPStatusError as exc:
                logger.exception(
                    "Greenhouse endpoint returned non-success status",
                    extra={"plugin": self.plugin_name, "endpoint": endpoint, "status_code": exc.response.status_code},
                )
                raise RetryablePluginError("Greenhouse endpoint returned an invalid status") from exc

        payload = response.json()
        jobs = payload.get("jobs")
        if not isinstance(jobs, list):
            logger.error("Greenhouse response is missing the jobs list", extra={"plugin": self.plugin_name})
            return []

        listings: List[JobListing] = []
        for item in jobs:
            if not isinstance(item, dict):
                logger.warning("Skipping invalid Greenhouse job entry", extra={"plugin": self.plugin_name, "entry": item})
                continue

            title = item.get("title")
            apply_url = item.get("absolute_url") or item.get("apply_url")
            published_at = _parse_iso_datetime(item.get("updated_at") or item.get("created_at"))

            if not title or not apply_url or not published_at:
                logger.warning(
                    "Skipping Greenhouse job with missing required fields",
                    extra={
                        "plugin": self.plugin_name,
                        "job_id": item.get("id"),
                        "title": title,
                        "apply_url": apply_url,
                        "published_at": published_at,
                    },
                )
                continue

            listings.append(
                JobListing(
                    company=item.get("company", "Greenhouse"),
                    title=title,
                    location=_normalize_location(item),
                    description=item.get("content", ""),
                    apply_url=apply_url,
                    skills=_normalize_skills(item),
                    remote=bool(item.get("remote", False)),
                    published_at=published_at,
                )
            )

        logger.info("Greenhouse jobs parsed", extra={"plugin": self.plugin_name, "count": len(listings)})
        return listings
