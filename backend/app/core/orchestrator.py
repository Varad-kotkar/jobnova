import asyncio
import logging
from typing import List

from .plugin_loader import load_plugins
from ..plugins.base import BasePlugin

logger = logging.getLogger(__name__)


class PluginOrchestrator:
    def __init__(self) -> None:
        self.plugins: List[BasePlugin] = []

    async def initialize(self) -> None:
        self.plugins = load_plugins()
        logger.info("Initialized %d plugins", len(self.plugins))

    async def collect_all(self) -> List[dict]:
        tasks = [self._run_plugin(plugin) for plugin in self.plugins]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        collected: List[dict] = []
        for plugin, result in zip(self.plugins, results):
            if isinstance(result, Exception):
                logger.error(
                    "Plugin %s failed: %s",
                    plugin.plugin_name,
                    result,
                    extra={"plugin": plugin.plugin_name},
                )
                continue
            collected.extend(result)

        logger.info("Collected %d records from %d plugins", len(collected), len(self.plugins))
        return collected

    async def _run_plugin(self, plugin: BasePlugin) -> List[dict]:
        logger.debug("Running plugin %s", plugin.plugin_name)
        return await plugin.collect()
