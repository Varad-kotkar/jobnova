from pathlib import Path
from typing import Optional

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


from pydantic_settings import SettingsConfigDict

class AppConfig(BaseSettings):
    app_name: str = "JobNova API"
    app_version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"
    docs_url: str = "/docs"
    openapi_url: str = "/openapi.json"
    api_base_url: Optional[str] = None
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://jobnova.vercel.app"
    allowed_cors_origins: Optional[str] = None
    cors_origins: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",   # <-- This is the important part
    )

app_settings = AppConfig()
