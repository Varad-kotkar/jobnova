from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict, Optional

import httpx
import jwt

logger = logging.getLogger("backend.app.firebase")


GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
_certs_cache: Dict[str, str] = {}
_certs_cache_expires_at: float = 0.0


async def _get_google_public_certs() -> Dict[str, str]:
    global _certs_cache, _certs_cache_expires_at
    now = time.time()
    if _certs_cache and now < _certs_cache_expires_at:
        return _certs_cache

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(GOOGLE_CERTS_URL)
            if resp.status_code == 200:
                _certs_cache = resp.json()
                _certs_cache_expires_at = now + 3600
                return _certs_cache
    except Exception as exc:
        logger.warning("Could not fetch Google public certs for Firebase verification: %s", exc)

    return _certs_cache


from cryptography.x509 import load_pem_x509_certificate

async def verify_firebase_id_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies a Firebase ID Token using Google public keys.

    Falls back to HMAC JWT validation for local development/testing tokens.
    """
    if not token or not isinstance(token, str):
        return None

    project_id = os.getenv("FIREBASE_PROJECT_ID", os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "")).strip()

    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        kid = unverified_header.get("kid")

        if alg == "RS256" and kid:
            certs = await _get_google_public_certs()
            cert_pem = certs.get(kid)
            if cert_pem:
                cert_obj = load_pem_x509_certificate(cert_pem.encode("utf-8"))
                public_key = cert_obj.public_key()

                unverified_claims = jwt.decode(token, options={"verify_signature": False})
                target_project_id = project_id or unverified_claims.get("aud")

                kwargs = {
                    "algorithms": ["RS256"],
                    "options": {"verify_aud": True},
                }
                if target_project_id:
                    kwargs["audience"] = target_project_id
                    kwargs["issuer"] = f"https://securetoken.google.com/{target_project_id}"

                payload = jwt.decode(token, public_key, **kwargs)
                return {
                    "uid": payload.get("sub") or payload.get("user_id"),
                    "email": payload.get("email"),
                    "email_verified": payload.get("email_verified", False),
                    "name": payload.get("name") or payload.get("email", "").split("@")[0],
                    "picture": payload.get("picture"),
                    "firebase": payload,
                }
    except Exception as exc:
        logger.warning("Firebase RS256 token verification failed: %s", exc)

    # Fallback to local HMAC JWT token decoding for unit tests and local dev
    from .security import decode_access_token
    return decode_access_token(token)

