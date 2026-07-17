from __future__ import annotations

import abc
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from tenacity import AsyncRetrying, RetryError, retry_if_exception_type, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class JobListing:
    company: str
    title: str
    location: str
    description: str
    apply_url: str
    skills: List[str]
    remote: bool
    published_at: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {
            "company": self.company,
            "title": self.title,
            "location": self.location,
            "description": self.description,
            "apply_url": self.apply_url,
            "skills": self.skills,
            "remote": self.remote,
            "published_at": self.published_at.isoformat(),
        }


class CollectorError(Exception):
    pass


class BaseCollector(abc.ABC):
    """Base class for all job collectors.

    Subclasses must implement ``collect`` to return a list of normalized job listings.
    The base class offers retry handling and structured logging.
    """

    default_retry_attempts = 3
    default_retry_wait_seconds = 1

    def __init__(self, *, retry_attempts: int | None = None, logger_name: str | None = None) -> None:
        self.retry_attempts = retry_attempts or self.default_retry_attempts
        self.logger = logging.getLogger(logger_name or self.__class__.__name__)

    async def collect_with_retry(self, *args: Any, **kwargs: Any) -> List[JobListing]:
        self.logger.debug("Starting collection with retry: %s(%s, %s)", self.__class__.__name__, args, kwargs)
        retryer = AsyncRetrying(
            stop=stop_after_attempt(self.retry_attempts),
            wait=wait_exponential(multiplier=self.default_retry_wait_seconds, min=self.default_retry_wait_seconds),
            retry=retry_if_exception_type(CollectorError),
            reraise=True,
        )

        try:
            async for attempt in retryer:
                with attempt:
                    self.logger.debug("Collector attempt %s", attempt.retry_state.attempt_number)
                    listings = await self.collect(*args, **kwargs)
                    self.logger.info("Collected %d listings from %s", len(listings), self.__class__.__name__)
                    return listings
        except RetryError as exc:
            self.logger.error("Collector failed after %s attempts: %s", self.retry_attempts, exc)
            raise CollectorError(f"Collector failed after {self.retry_attempts} attempts") from exc

    @abc.abstractmethod
    async def collect(self, *args: Any, **kwargs: Any) -> List[JobListing]:
        """Collect job listings asynchronously.

        Implementations should raise CollectorError for retryable failures.
        """
        raise NotImplementedError
