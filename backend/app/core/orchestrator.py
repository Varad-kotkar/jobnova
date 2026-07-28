from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from time import perf_counter
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import AsyncRetrying, RetryError, retry_if_exception_type, stop_after_attempt, wait_exponential

from ..database.session import get_async_sessionmaker
from ..models.job_listing import JobListing
from ..models.plugin_run import PluginRun
from ..plugins.base import BasePlugin, RetryablePluginError
from ..services.ingestion import ingest_job_listings, IngestionStats
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
    jobs_updated: int
    jobs_duplicates: int
    success: bool
    error_message: Optional[str] = None


@dataclass(frozen=True)
class OrchestratorSummary:
    inserted: int
    updated: int
    duplicates: int
    errors: List[str]
    plugin_runs: List[PluginExecutionSummary]
    total_jobs_fetched: int


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
        results = []
        for plugin in self.plugins:
            try:
                res = await self._execute_plugin(plugin)
                results.append(res)
            except Exception as exc:
                results.append(exc)

        summaries: List[PluginExecutionSummary] = []
        total_inserted = 0
        total_updated = 0
        total_duplicates = 0
        total_jobs_fetched = 0
        all_errors: List[str] = []

        for plugin, result in zip(self.plugins, results):
            if isinstance(result, Exception):
                logger.exception(
                    "Unexpected orchestrator error",
                    extra={"plugin": plugin.plugin_name},
                )
                err_msg = f"Plugin '{plugin.plugin_name}' failed: {result}"
                all_errors.append(err_msg)
                summaries.append(
                    PluginExecutionSummary(
                        plugin_name=plugin.plugin_name,
                        started_at=datetime.now(timezone.utc),
                        finished_at=datetime.now(timezone.utc),
                        duration_ms=0,
                        jobs_fetched=0,
                        jobs_inserted=0,
                        jobs_updated=0,
                        jobs_duplicates=0,
                        success=False,
                        error_message=str(result),
                    )
                )
                continue

            summaries.append(result)
            total_jobs_fetched += result.jobs_fetched
            total_inserted += result.jobs_inserted
            total_updated += result.jobs_updated
            total_duplicates += result.jobs_duplicates
            if result.error_message:
                all_errors.append(f"[{plugin.plugin_name}] {result.error_message}")

        logger.info("=== INGESTION ORCHESTRATION SUMMARY ===")
        for s in summaries:
            logger.info(
                "  [%-15s] Fetched: %-4d | Inserted: %-4d | Updated: %-4d | Duplicates: %-4d | Status: %s%s",
                s.plugin_name,
                s.jobs_fetched,
                s.jobs_inserted,
                s.jobs_updated,
                s.jobs_duplicates,
                "SUCCESS" if s.success else "FAILED",
                f" | Error: {s.error_message}" if s.error_message else "",
            )

        logger.info(
            "TOTALS: Plugins: %d | Fetched: %d | Inserted: %d | Updated: %d | Duplicates: %d | Errors: %d",
            len(summaries), total_jobs_fetched, total_inserted, total_updated, total_duplicates, len(all_errors),
        )

        return OrchestratorSummary(
            inserted=total_inserted,
            updated=total_updated,
            duplicates=total_duplicates,
            errors=all_errors,
            plugin_runs=summaries,
            total_jobs_fetched=total_jobs_fetched,
        )

    async def _execute_plugin(self, plugin: BasePlugin) -> PluginExecutionSummary:
        started_at = datetime.now(timezone.utc)
        run_start = perf_counter()
        jobs_fetched = 0
        jobs_inserted = 0
        jobs_updated = 0
        jobs_duplicates = 0
        success = False
        error_message: Optional[str] = None

        async with get_async_sessionmaker()() as session:
            plugin_run = PluginRun(
                plugin_name=plugin.plugin_name,
                started_at=started_at,
                status="running",
                jobs_fetched=0,
                jobs_inserted=0,
            )
            session.add(plugin_run)
            await session.commit()

            try:
                listings = await self._collect_with_retry(plugin)
                jobs_fetched = len(listings)
                ingest_stats = await ingest_job_listings(listings, plugin.plugin_name, session=session)
                jobs_inserted = ingest_stats.inserted
                jobs_updated = ingest_stats.updated
                jobs_duplicates = ingest_stats.duplicates
                if ingest_stats.errors:
                    error_message = "; ".join(ingest_stats.errors)
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
                await session.commit()

        return PluginExecutionSummary(
            plugin_name=plugin.plugin_name,
            started_at=started_at,
            finished_at=finished_at,
            duration_ms=duration_ms,
            jobs_fetched=jobs_fetched,
            jobs_inserted=jobs_inserted,
            jobs_updated=jobs_updated,
            jobs_duplicates=jobs_duplicates,
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
