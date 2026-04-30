"""Authentication routes — register / login / me.

Lightweight prototype-grade auth: password hashing via PBKDF2 and stateless
HMAC-signed bearer tokens (see backend.auth). Replace with a managed
identity provider before production.
"""
from __future__ import annotations

import sqlite3
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status

from backend.auth import (
    create_token,
    extract_bearer,
    hash_password,
    verify_password,
    verify_token,
)
from backend.database import fetch_user_by_email, insert_user
from backend.schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserPublic,
)


router = APIRouter(prefix="/auth", tags=["auth"])


def _to_public(user_row: dict) -> UserPublic:
    return UserPublic(
        email=user_row["email"],
        name=user_row["name"],
        organization=user_row.get("organization"),
        role=user_row.get("role"),
        created_at=user_row.get("created_at"),
    )


def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> dict:
    token = extract_bearer(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_token(token)
    if not payload or not isinstance(payload.get("sub"), str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = fetch_user_by_email(payload["sub"])
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest) -> AuthResponse:
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )
    try:
        user = insert_user(
            email=req.email,
            name=req.name,
            organization=req.organization,
            role=req.role,
            password_hash=hash_password(req.password),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for that email.",
        )
    token = create_token(sub=user["email"])
    return AuthResponse(user=_to_public(user), token=token)


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest) -> AuthResponse:
    user = fetch_user_by_email(req.email)
    if user is None or not verify_password(req.password, user["password_hash"]):
        # Same error for both branches to avoid email-enumeration.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    token = create_token(sub=user["email"])
    return AuthResponse(user=_to_public(user), token=token)


@router.get("/me", response_model=UserPublic)
def me(current_user: dict = Depends(get_current_user)) -> UserPublic:
    return _to_public(current_user)
