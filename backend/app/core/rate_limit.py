from datetime import datetime, timezone
from typing import Dict, Tuple

from fastapi import HTTPException, Request, status


class RateLimiter:
    """In-memory rate limiter tracking request velocity per IP/User."""

    _requests: Dict[str, Tuple[int, float]] = {}

    @classmethod
    async def check_rate_limit(
        cls,
        key: str,
        max_requests: int = 100,
        window_seconds: int = 60,
    ) -> None:
        now = datetime.now(timezone.utc).timestamp()

        if key in cls._requests:
            count, window_start = cls._requests[key]
            if now - window_start < window_seconds:
                if count >= max_requests:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded. Please wait before retrying.",
                    )
                cls._requests[key] = (count + 1, window_start)
            else:
                cls._requests[key] = (1, now)
        else:
            cls._requests[key] = (1, now)

    @classmethod
    def reset(cls) -> None:
        cls._requests.clear()
