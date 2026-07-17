from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass(frozen=True)
class PluginConfig:
    name: str
    enabled: bool = True
    settings: Dict[str, Any] = field(default_factory=dict)


class PluginError(Exception):
    pass


class RetryablePluginError(PluginError):
    pass


class BasePlugin(ABC):
    def __init__(self, config: PluginConfig) -> None:
        self.config = config

    @abstractmethod
    async def collect(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    @property
    def plugin_name(self) -> str:
        return self.config.name
