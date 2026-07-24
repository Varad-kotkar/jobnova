from ..base import BasePlugin, PluginConfig


class Plugin(BasePlugin):
    async def collect(self) -> list:
        # Lever plugin not implemented yet — disabled by default
        return []
