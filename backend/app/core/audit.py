from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("backend.app.security_audit")


class AuditLogger:
    @staticmethod
    def log_security_event(
        event_name: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event_name,
            "user_id": user_id or "anonymous",
            "ip_address": ip_address or "unknown",
            "details": details or {},
        }
        logger.info(f"SECURITY_AUDIT: {payload}")
