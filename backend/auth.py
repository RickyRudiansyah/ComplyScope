"""Authentication primitives for VeriTrace.

Self-contained — no third-party crypto/JWT dependencies. Passwords are
hashed with PBKDF2-HMAC-SHA256, and bearer tokens are signed with
HMAC-SHA256 over a JSON payload.

This is intentionally lightweight: a real production deployment should
swap this for a proper identity provider (Entra ID, Auth0, Cognito, etc.).
The route surface in routes/auth.py keeps the contract narrow so the
swap is mechanical.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path
from typing import Optional

from backend.config import settings, ROOT_DIR


# ─── Password hashing ────────────────────────────────────────────────────

_PBKDF2_ITERATIONS = 200_000
_PBKDF2_SALT_BYTES = 16
_PBKDF2_HASH_BYTES = 32
_PBKDF2_PREFIX = "pbkdf2_sha256"


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _b64d(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def hash_password(password: str) -> str:
    salt = os.urandom(_PBKDF2_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS, _PBKDF2_HASH_BYTES
    )
    return f"{_PBKDF2_PREFIX}${_PBKDF2_ITERATIONS}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        prefix, iter_str, salt_b64, hash_b64 = stored.split("$", 3)
    except ValueError:
        return False
    if prefix != _PBKDF2_PREFIX:
        return False
    try:
        iterations = int(iter_str)
        salt = _b64d(salt_b64)
        expected = _b64d(hash_b64)
    except (ValueError, base64.binascii.Error):
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations, len(expected)
    )
    return hmac.compare_digest(digest, expected)


# ─── Bearer token signing (stateless) ────────────────────────────────────

_DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days
_SECRET_FILE = ROOT_DIR / "backend" / "storage" / ".auth_secret"


def _load_or_create_secret() -> bytes:
    """Resolve the HMAC secret used to sign tokens.

    Priority:
      1. AUTH_SECRET env var (preferred for prod).
      2. A persisted random secret in backend/storage/.auth_secret so
         tokens survive restarts in dev.
    """
    env_val = os.getenv("AUTH_SECRET", "").strip()
    if env_val:
        return env_val.encode("utf-8")
    try:
        if _SECRET_FILE.exists():
            data = _SECRET_FILE.read_bytes().strip()
            if data:
                return data
        _SECRET_FILE.parent.mkdir(parents=True, exist_ok=True)
        new_secret = secrets.token_urlsafe(48).encode("utf-8")
        _SECRET_FILE.write_bytes(new_secret)
        try:
            os.chmod(_SECRET_FILE, 0o600)
        except OSError:
            pass
        return new_secret
    except OSError:
        # Last-resort ephemeral secret — tokens won't survive restart.
        return secrets.token_urlsafe(48).encode("utf-8")


_SECRET: Optional[bytes] = None


def _secret() -> bytes:
    global _SECRET
    if _SECRET is None:
        _SECRET = _load_or_create_secret()
    return _SECRET


def create_token(*, sub: str, ttl_seconds: int = _DEFAULT_TOKEN_TTL_SECONDS) -> str:
    payload = {
        "sub": sub,
        "iat": int(time.time()),
        "exp": int(time.time()) + int(ttl_seconds),
    }
    payload_b64 = _b64(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(_secret(), payload_b64.encode("ascii"), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64(sig)}"


def verify_token(token: str) -> Optional[dict]:
    """Return the payload dict if the token is valid and unexpired, else None."""
    if not token or "." not in token:
        return None
    payload_b64, sig_b64 = token.rsplit(".", 1)
    try:
        expected_sig = hmac.new(
            _secret(), payload_b64.encode("ascii"), hashlib.sha256
        ).digest()
        provided_sig = _b64d(sig_b64)
    except (ValueError, base64.binascii.Error):
        return None
    if not hmac.compare_digest(expected_sig, provided_sig):
        return None
    try:
        payload = json.loads(_b64d(payload_b64))
    except (ValueError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    exp = payload.get("exp")
    if isinstance(exp, (int, float)) and exp < time.time():
        return None
    return payload


def extract_bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.strip().split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip() or None
