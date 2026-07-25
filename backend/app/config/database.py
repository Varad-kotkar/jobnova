import re
from pathlib import Path
from typing import Any, Dict, Tuple

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def sanitize_async_database_url(url: str) -> Tuple[str, Dict[str, Any]]:
    """
    Sanitizes database URL for asyncpg / SQLAlchemy async engine.

    1. Converts legacy postgres:// or postgresql:// to postgresql+asyncpg://
    2. Strips sslmode parameter from query string because asyncpg does not accept sslmode keyword arg.
    3. Returns connect_args={"ssl": True} if sslmode=require was specified in the original URL string.
    """
    if not isinstance(url, str) or not url.strip():
        return url, {}

    connect_args: Dict[str, Any] = {}
    clean_url = url.strip()

    # Convert driver prefix for asyncpg
    if clean_url.startswith("postgres://"):
        clean_url = clean_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif clean_url.startswith("postgresql://") and not clean_url.startswith("postgresql+"):
        clean_url = clean_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Check if sslmode query parameter is present in URL
    if "sslmode=" in clean_url:
        sslmode_match = re.search(r"[?&]sslmode=([^&]+)", clean_url)
        if sslmode_match:
            mode_val = sslmode_match.group(1).lower()
            if mode_val in ("require", "prefer", "verify-ca", "verify-full", "true", "1"):
                connect_args["ssl"] = True

        # Remove sslmode=... parameter cleanly from URL
        clean_url = re.sub(r"([?&])sslmode=[^&]*(&|$)", r"\1", clean_url)
        clean_url = clean_url.rstrip("?&")
        clean_url = clean_url.replace("?&", "?")

    return clean_url, connect_args


class DatabaseConfig(BaseSettings):
    database_url: str

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Any) -> str:
        if isinstance(v, str):
            clean_url, _ = sanitize_async_database_url(v)
            return clean_url
        return v

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


database_settings = DatabaseConfig()
database_config = database_settings