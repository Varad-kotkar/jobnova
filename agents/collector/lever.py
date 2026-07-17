from __future__ import annotations

from typing import List

from .base import BaseCollector, JobListing, CollectorError


class LeverCollector(BaseCollector):
    async def collect(self) -> List[JobListing]:
        raise CollectorError("Lever collector is not implemented yet")
