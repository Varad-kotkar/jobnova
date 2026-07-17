from __future__ import annotations

import asyncio
import logging
from typing import Iterable, List

from .base import BaseCollector, JobListing

logger = logging.getLogger(__name__)


class CollectorDispatcher:
    """Dispatches collection jobs across multiple collectors."""

    def __init__(self, collectors: Iterable[BaseCollector]) -> None:
        self.collectors = list(collectors)
        self.logger = logging.getLogger(self.__class__.__name__)

    async def collect_all(self) -> List[JobListing]:
        self.logger.debug("Dispatching collect_all to %d collectors", len(self.collectors))
        tasks = [self._wrap_collector(collector) for collector in self.collectors]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        listings: List[JobListing] = []
        for collector, result in zip(self.collectors, results):
            if isinstance(result, Exception):
                self.logger.error("Collector %s failed: %s", collector.__class__.__name__, result)
                continue
            listings.extend(result)

        self.logger.info("Collected %d total listings", len(listings))
        return listings

    async def _wrap_collector(self, collector: BaseCollector) -> List[JobListing]:
        self.logger.debug("Running collector %s", collector.__class__.__name__)
        return await collector.collect_with_retry()
