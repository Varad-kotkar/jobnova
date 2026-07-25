from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("backend.app.cache")


class CacheManager:
    """High-performance async cache manager supporting memory TTL and Redis invalidation patterns."""

    _memory_cache: Dict[str, Tuple[Any, float]] = {}

    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        if key in cls._memory_cache:
            value, expires_at = cls._memory_cache[key]
            now = datetime.now(timezone.utc).timestamp()
            if now < expires_at:
                return value
            else:
                del cls._memory_cache[key]
        return None

    @classmethod
    async def set(cls, key: str, value: Any, ttl_seconds: int = 300) -> None:
        expires_at = datetime.now(timezone.utc).timestamp() + ttl_seconds
        cls._memory_cache[key] = (value, expires_at)

    @classmethod
    async def delete(cls, key: str) -> None:
        cls._memory_cache.pop(key, None)

    @classmethod
    async def delete_pattern(cls, pattern_prefix: str) -> None:
        keys_to_del = [k for k in cls._memory_cache.keys() if k.startswith(pattern_prefix)]
        for k in keys_to_del:
            cls._memory_cache.pop(k, None)

    @classmethod
    async def clear(cls) -> None:
        cls._memory_cache.clear()
