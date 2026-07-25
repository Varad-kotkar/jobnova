from datetime import datetime, timezone
import logging
from typing import Dict, Tuple

logger = logging.getLogger("backend.app.telemetry")


class TelemetryService:
    """System telemetry collector exporting request metrics, status codes, and latency data."""

    _start_time: float = datetime.now(timezone.utc).timestamp()
    _total_requests: int = 0
    _status_counts: Dict[int, int] = {}
    _endpoint_latencies: Dict[str, float] = {}

    @classmethod
    def record_request(cls, method: str, path: str, status_code: int, latency_ms: float) -> None:
        cls._total_requests += 1
        cls._status_counts[status_code] = cls._status_counts.get(status_code, 0) + 1
        key = f"{method} {path}"
        cls._endpoint_latencies[key] = latency_ms

    @classmethod
    def get_uptime_seconds(cls) -> float:
        return datetime.now(timezone.utc).timestamp() - cls._start_time

    @classmethod
    def get_metrics_prometheus(cls) -> str:
        lines = [
            "# HELP jobnova_http_requests_total Total number of HTTP requests processed.",
            "# TYPE jobnova_http_requests_total counter",
            f"jobnova_http_requests_total {cls._total_requests}",
            "",
            "# HELP jobnova_uptime_seconds Total application uptime in seconds.",
            "# TYPE jobnova_uptime_seconds gauge",
            f"jobnova_uptime_seconds {cls.get_uptime_seconds():.2f}",
            "",
            "# HELP jobnova_http_response_status HTTP response status code distribution.",
            "# TYPE jobnova_http_response_status counter",
        ]

        for code, count in sorted(cls._status_counts.items()):
            lines.append(f'jobnova_http_response_status{{code="{code}"}} {count}')

        return "\n".join(lines) + "\n"
