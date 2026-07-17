from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from time import perf_counter
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import AsyncRetrying, RetryError, retry_if_exception_type, stop_after_attempt, wait_exponential

from ..database.session import get_async_sessionmaker
from ..models.job_listing import JobListing
from ..models.plugin_run import PluginRun
from ..plugins.base import BasePlugin, RetryablePluginError
from ..services.ingestion import ingest_job_listings
from .plugin_loader import load_plugins

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PluginExecutionSummary:
    plugin_name: str
    started_at: datetime
    finished_at: Optional[datetime]
    duration_ms: Optional[int]
    jobs_fetched: int
    jobs_inserted: int
    success: bool
    error_message: Optional[str] = None


@dataclass(frozen=True)
class OrchestratorSummary:
    plugin_runs: List[PluginExecutionSummary]
    total_jobs_fetched: int
    total_jobs_inserted: int


class PluginOrchestrator:
    def __init__(self, retry_attempts: int = 3, retry_wait_seconds: int = 1) -> None:
        self.plugins: List[BasePlugin] = []
        self.retry_attempts = retry_attempts
        self.retry_wait_seconds = retry_wait_seconds

    async def initialize(self) -> None:
        self.plugins = load_plugins()
        logger.info(
            "Initialized plugins",
            extra={"plugin_count": len(self.plugins)},
        )

    async def run(self) -> OrchestratorSummary:
        tasks = [self._execute_plugin(plugin) for plugin in self.plugins]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        summaries: List[PluginExecutionSummary] = []
        total_jobs_fetched = 0
        total_jobs_inserted = 0

        for plugin, result in zip(self.plugins, results):
            if isinstance(result, Exception):
                logger.exception(
                    "Unexpected orchestrator error",
                    extra={"plugin": plugin.plugin_name},
                )
                summaries.append(
                    PluginExecutionSummary(
                        plugin_name=plugin.plugin_name,
                        started_at=datetime.now(timezone.utc),
                        finished_at=datetime.now(timezone.utc),
                        duration_ms=0,
                        jobs_fetched=0,
                        jobs_inserted=0,
                        success=False,
                        error_message=str(result),
                    )
                )
                continue

            summaries.append(result)
            total_jobs_fetched += result.jobs_fetched
            total_jobs_inserted += result.jobs_inserted

        logger.info(
            "Orchestration summary",
            extra={
                "plugins": len(summaries),
                "total_jobs_fetched": total_jobs_fetched,
                "total_jobs_inserted": total_jobs_inserted,
            },
        )

        return OrchestratorSummary(
            plugin_runs=summaries,
            total_jobs_fetched=total_jobs_fetched,
            total_jobs_inserted=total_jobs_inserted,
        )

    async def _execute_plugin(self, plugin: BasePlugin) -> PluginExecutionSummary:
        started_at = datetime.now(timezone.utc)
        run_start = perf_counter()
        jobs_fetched = 0
        jobs_inserted = 0
        success = False
        error_message: Optional[str] = None

        async with get_async_sessionmaker()() as session:
            async with session.begin():
                plugin_run = PluginRun(
                    plugin_name=plugin.plugin_name,
                    started_at=started_at,
                    status="running",
                    jobs_fetched=0,
                    jobs_inserted=0,
                )
                session.add(plugin_run)
                await session.flush()

                try:
                    listings = await self._collect_with_retry(plugin)
                    jobs_fetched = len(listings)
                    ingested = await ingest_job_listings(listings, plugin.plugin_name, session=session)
                    jobs_inserted = len(ingested)
                    success = True
                    plugin_run.status = "success"
                except Exception as exc:
                    error_message = str(exc)
                    plugin_run.status = "failure"
                    logger.exception(
                        "Plugin execution failed",
                        extra={"plugin": plugin.plugin_name, "error": error_message},
                    )
                finally:
                    finished_at = datetime.now(timezone.utc)
                    duration_ms = int((perf_counter() - run_start) * 1000)
                    plugin_run.finished_at = finished_at
                    plugin_run.duration_ms = duration_ms
                    plugin_run.jobs_fetched = jobs_fetched
                    plugin_run.jobs_inserted = jobs_inserted
                    plugin_run.error = error_message

        return PluginExecutionSummary(
            plugin_name=plugin.plugin_name,
            started_at=started_at,
            finished_at=finished_at,
            duration_ms=duration_ms,
            jobs_fetched=jobs_fetched,
            jobs_inserted=jobs_inserted,
            success=success,
            error_message=error_message,
        )

    async def _collect_with_retry(self, plugin: BasePlugin) -> List[JobListing]:
        retryer = AsyncRetrying(
            stop=stop_after_attempt(self.retry_attempts),
            wait=wait_exponential(multiplier=self.retry_wait_seconds, min=self.retry_wait_seconds),
            retry=retry_if_exception_type(RetryablePluginError),
            reraise=True,
        )

        async for attempt in retryer:
            with attempt:
                logger.debug(
                    "Collecting jobs from plugin",
                    extra={
                        "plugin": plugin.plugin_name,
                        "attempt": attempt.retry_state.attempt_number,
                    },
                )
                return await plugin.collect()
