from ..base import BasePlugin, PluginConfig


class Plugin(BasePlugin):
    async def collect(self) -> list:
        # Ashby plugin not implemented yet — disabled by default
        return []
