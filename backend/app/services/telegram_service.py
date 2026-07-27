from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("backend.app.telegram")

_SENT_JOB_IDS: set[str] = set()
_POST_LOGS: list[Dict[str, Any]] = []


class TelegramService:
    @staticmethod
    def get_credentials() -> tuple[str, str]:
        token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        channel_id = os.getenv("TELEGRAM_CHANNEL_ID", "").strip()
        return token, channel_id

    @staticmethod
    def format_job_message(job_data: Dict[str, Any]) -> str:
        title = job_data.get("title", "Engineering Position")
        company = job_data.get("company", "Tech Employer")
        if isinstance(company, dict):
            company = company.get("name", "Tech Employer")

        location = job_data.get("location", "Remote")
        remote = job_data.get("remote", True)
        salary = job_data.get("salary_range") or job_data.get("salary", "Competitive")
        employment_type = "Full-Time" if not job_data.get("contract") else "Contract"
        experience = job_data.get("experience_level") or "Entry - Mid Level"
        apply_url = job_data.get("apply_url") or f"https://jobnova.vercel.app/jobs/{job_data.get('slug', job_data.get('id', ''))}"

        loc_display = f"{location} ({'Remote' if remote else 'On-site'})"

        msg = (
            f"🚀 <b>New Job Posted</b>\n\n"
            f"💼 <b>{title}</b>\n"
            f"🏢 <b>Company:</b> {company}\n"
            f"📍 <b>Location:</b> {loc_display}\n"
            f"💰 <b>Salary:</b> {salary}\n"
            f"🕒 <b>Employment Type:</b> {employment_type}\n"
            f"⭐ <b>Experience:</b> {experience}\n\n"
            f"🔗 <b>Apply Now:</b>\n{apply_url}\n\n"
            f"#JobNova #Hiring #TechJobs"
        )
        return msg

    @classmethod
    async def post_job_to_channel(cls, job_data: Dict[str, Any]) -> bool:
        job_id = str(job_data.get("id", ""))
        if job_id and job_id in _SENT_JOB_IDS:
            logger.info("Skipped duplicate Telegram post for job ID %s", job_id)
            return True

        token, channel_id = cls.get_credentials()
        if not token or not channel_id:
            logger.info("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set.")
            return False

        message_text = cls.format_job_message(job_data)
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": channel_id,
            "text": message_text,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
        }

        # Exponential backoff retry (up to 3 attempts)
        for attempt in range(1, 4):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    res_json = resp.json()

                    log_entry = {
                        "job_id": job_id,
                        "job_title": job_data.get("title"),
                        "channel": channel_id,
                        "status_code": resp.status_code,
                        "success": resp.status_code == 200 and res_json.get("ok", False),
                        "response": res_json,
                        "attempt": attempt,
                    }
                    _POST_LOGS.append(log_entry)

                    if resp.status_code == 200 and res_json.get("ok"):
                        if job_id:
                            _SENT_JOB_IDS.add(job_id)
                        logger.info("Successfully posted job '%s' to Telegram channel %s", job_data.get("title"), channel_id)
                        return True
                    else:
                        logger.warning("Telegram API error (attempt %d): %s", attempt, res_json)
            except Exception as exc:
                logger.warning("Failed to send Telegram message (attempt %d): %s", attempt, exc)

            if attempt < 3:
                await asyncio.sleep(2 ** attempt)

        return False

    @classmethod
    async def send_test_message(cls, test_channel: Optional[str] = None) -> Dict[str, Any]:
        token, default_channel = cls.get_credentials()
        target_channel = test_channel or default_channel

        if not token or not target_channel:
            return {
                "success": False,
                "error": "TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID environment variable is missing.",
            }

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        test_text = (
            "🧪 <b>JobNova Telegram Integration Test</b>\n\n"
            "✅ Your Telegram bot is active and correctly configured!\n"
            "Job listings will automatically broadcast to this channel.\n\n"
            "#JobNova #SystemCheck"
        )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json={
                    "chat_id": target_channel,
                    "text": test_text,
                    "parse_mode": "HTML",
                })
                res_data = resp.json()
                return {
                    "success": resp.status_code == 200 and res_data.get("ok", False),
                    "status_code": resp.status_code,
                    "target_channel": target_channel,
                    "telegram_response": res_data,
                }
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    @classmethod
    def get_logs(cls) -> list[Dict[str, Any]]:
        return _POST_LOGS[-50:]
