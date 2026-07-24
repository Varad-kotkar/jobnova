from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..models.job_listing import JobListing


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
    async def collect(self) -> List[JobListing]:
        raise NotImplementedError

    @property
    def plugin_name(self) -> str:
        return self.config.name
