from pathlib import Path
from typing import Optional

from pydantic import BaseSettings, Field, AnyUrl


class Settings(BaseSettings):
    app_name: str = Field("JobNova API", env="APP_NAME")
    app_version: str = Field("0.1.0", env="APP_VERSION")
    environment: str = Field("development", env="ENVIRONMENT")
    database_url: Optional[str] = Field(None, env="DATABASE_URL")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    docs_url: str = Field("/docs", env="DOCS_URL")
    openapi_url: str = Field("/openapi.json", env="OPENAPI_URL")

    class Config:
        env_file = Path(__file__).resolve().parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
