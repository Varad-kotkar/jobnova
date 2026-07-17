from pathlib import Path
from typing import List

from pydantic import BaseSettings, Field


class PluginSettings(BaseSettings):
    enabled_plugins: List[str] = Field(default_factory=list, env="ENABLED_PLUGINS")
    plugin_path: str = Field("app.plugins", env="PLUGIN_PACKAGE")

    class Config:
        env_file = Path(__file__).resolve().parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


plugin_settings = PluginSettings()
