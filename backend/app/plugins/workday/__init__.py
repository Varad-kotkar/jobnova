from ..base import BasePlugin, PluginConfig


class Plugin(BasePlugin):
    async def collect(self) -> list:
        # Workday plugin not implemented yet — disabled by default
        return []
