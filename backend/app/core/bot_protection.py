from __future__ import annotations

import logging
import time
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, Request, status

logger = logging.getLogger("backend.app.bot_protection")

# Suspicious scraper user agents
KNOWN_BOT_USER_AGENTS = [
    "sqlmap",
    "nikto",
    "absinthe",
    "dirbuster",
    "python-urllib",
    "curl/7.0",
    "gobuster",
]

# Simple in-memory sliding window rate limiter
_request_history: Dict[str, List[float]] = {}


def check_rate_limit(client_id: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
    """Checks whether client_id has exceeded max_requests in window_seconds."""
    now = time.time()
    cutoff = now - window_seconds

    history = _request_history.get(client_id, [])
    valid_history = [t for t in history if t > cutoff]
    valid_history.append(now)
    _request_history[client_id] = valid_history

    return len(valid_history) <= max_requests


def verify_honeypot(payload: Dict) -> None:
    """Rejects request if invisible honeypot field 'bot_field' or 'honeypot' is filled."""
    honeypot_val = payload.get("bot_field") or payload.get("honeypot")
    if honeypot_val and str(honeypot_val).strip():
        logger.warning("Bot honeypot triggered by payload submission")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Automated submission detected. Request rejected.",
        )


async def anti_bot_middleware(request: Request, call_next):
    user_agent = request.headers.get("User-Agent", "").lower()

    if any(bot_agent in user_agent for bot_agent in KNOWN_BOT_USER_AGENTS):
        logger.warning("Blocked known bot user agent: %s", user_agent)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Automated scraping agent detected.",
        )

    # Apply rate limiting on sensitive routes
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path

    if path.startswith("/api/auth") or path.startswith("/api/applications") or path.startswith("/api/recruiter/jobs"):
        if not check_rate_limit(f"{client_ip}:{path}", max_requests=20, window_seconds=60):
            logger.warning("Rate limit exceeded for client %s on path %s", client_ip, path)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again shortly.",
            )

    return await call_next(request)
