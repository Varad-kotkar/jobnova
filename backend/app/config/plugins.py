
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class PluginConfig(BaseSettings):
    greenhouse_url: str | None = None
    lever_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

plugin_settings = PluginConfig()


