from ..base import BasePlugin, PluginConfig


class Plugin(BasePlugin):
    async def collect(self) -> list[dict]:
        raise NotImplementedError("Ashby plugin not implemented yet")
