from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import logging
import os
import secrets
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.session import get_session
from ..models.user import User

logger = logging.getLogger("backend.app.security")

SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET") or "jobnova-super-secret-jwt-key-change-in-production-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, key_hex = hashed_password.split("$")
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return hmac.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp())})

    header = {"alg": "HS256", "typ": "JWT"}
    header_encoded = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_encoded = _base64url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))

    signature_base = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signature_base.encode("utf-8"), hashlib.sha256).digest()
    signature_encoded = _base64url_encode(signature)

    return f"{signature_base}.{signature_encoded}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_encoded, payload_encoded, signature_encoded = parts
        signature_base = f"{header_encoded}.{payload_encoded}"

        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signature_base.encode("utf-8"), hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_encoded)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _base64url_decode(payload_encoded)
        payload = json.loads(payload_bytes.decode("utf-8"))

        exp = payload.get("exp")
        if exp and int(datetime.now(timezone.utc).timestamp()) > exp:
            return None

        return payload
    except Exception as exc:
        logger.debug("Failed decoding JWT token: %s", exc)
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user: Optional[User] = None

    if payload and "sub" in payload:
        user_id = payload["sub"]
        query = select(User).where(User.id == user_id)
        result = await session.execute(query)
        user = result.scalars().first()

    # Fallback to Firebase ID Token verification if local token decoding didn't match
    if not user:
        try:
            from .firebase import verify_firebase_id_token
            fb_info = await verify_firebase_id_token(token)
            if fb_info:
                fb_email = fb_info.get("email", "").strip().lower()
                fb_uid = fb_info.get("uid")

                # Primary lookup by Firebase UID
                if fb_uid:
                    stmt = select(User).where(User.id == str(fb_uid))
                    res = await session.execute(stmt)
                    user = res.scalars().first()

                # Fallback lookup by email
                if not user and fb_email:
                    stmt = select(User).where(User.email == fb_email)
                    res = await session.execute(stmt)
                    user = res.scalars().first()

                if not user and fb_email:
                    # Auto-provision user account for Firebase Google SSO
                    import uuid
                    from ..models.user_profile import UserProfile
                    new_user_id = str(fb_uid) if fb_uid and len(str(fb_uid)) <= 36 else str(uuid.uuid4())
                    new_user = User(
                        id=new_user_id,
                        email=fb_email,
                        hashed_password=None,
                        full_name=fb_info.get("name") or fb_email.split("@")[0],
                        avatar_url=fb_info.get("picture"),
                        role="candidate",
                        is_active=True,
                        is_verified=fb_info.get("email_verified", True),
                    )
                    session.add(new_user)
                    await session.flush()

                    new_profile = UserProfile(
                        user_id=new_user.id,
                        headline=None,
                        skills=[],
                        preferred_roles=[],
                        completion_percentage=15,
                        onboarding_completed=False,
                    )
                    session.add(new_profile)
                    await session.commit()
                    user = new_user
                elif user:
                    # Update safe non-destructive fields for returning users
                    updated = False
                    if fb_info.get("picture") and user.avatar_url != fb_info["picture"]:
                        user.avatar_url = fb_info["picture"]
                        updated = True
                    if not user.is_verified and fb_info.get("email_verified"):
                        user.is_verified = True
                        updated = True
                    if updated:
                        await session.commit()
        except Exception as exc:
            logger.warning("Firebase token verification or user provisioning failed: %s", exc, exc_info=True)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or user account inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

