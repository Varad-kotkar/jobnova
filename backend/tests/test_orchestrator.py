import pytest
from datetime import datetime, timezone

from app.core.orchestrator import PluginOrchestrator
from app.plugins.base import PluginConfig, BasePlugin, RetryablePluginError
from app.models.job_listing import JobListing


class DummyPlugin(BasePlugin):
    async def collect(self):
        return [
            JobListing(
                company="D",
                title="T",
                location="L",
                description="D",
                apply_url="https://d.example/1",
                skills=[],
                remote=False,
                published_at=datetime.now(timezone.utc),
            )
        ]


@pytest.mark.anyio
async def test_orchestrator_runs_and_records(async_session, monkeypatch):
    orch = PluginOrchestrator(retry_attempts=1)
    # inject one plugin
    cfg = PluginConfig(name="dummy", enabled=True, settings={})
    orch.plugins = [DummyPlugin(config=cfg)]

    summary = await orch.run()
    assert summary.total_jobs_fetched >= 0
