"""Pydantic response schemas for the VeriTrace API."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_ALLOWED_ROLES = {
    "QA Reviewer",
    "QA Manager",
    "Supplier Quality",
    "Regulatory Affairs",
    "Operations",
    "Other",
}


class HealthResponse(BaseModel):
    status: str
    service: str
    doc_intel_configured: bool
    azure_openai_configured: bool


class MaterialBase(BaseModel):
    material_code: str
    material_name: str
    category: Optional[str] = None
    min_shelf_life_days: Optional[int] = None
    storage_requirement: Optional[str] = None


class MaterialSpec(BaseModel):
    parameter: str
    method: Optional[str] = None
    spec_type: str
    spec_min: Optional[float] = None
    spec_max: Optional[float] = None
    expected_text: Optional[str] = None
    unit: Optional[str] = None
    required: bool
    criticality: Optional[str] = None
    aliases: List[str] = Field(default_factory=list)


class ApprovedSupplier(BaseModel):
    supplier_name: str
    status: str


class MaterialSupplierStatus(BaseModel):
    supplier_name: str
    status: str


class MaterialDetail(MaterialBase):
    specs: List[MaterialSpec] = Field(default_factory=list)
    approved_suppliers: List[ApprovedSupplier] = Field(default_factory=list)
    supplier_statuses: List[MaterialSupplierStatus] = Field(default_factory=list)


class Supplier(BaseModel):
    supplier_name: str
    status: str


class Finding(BaseModel):
    code: str
    severity: str
    score: int
    message: str
    parameter: Optional[str] = None
    evidence: Dict[str, Any] = Field(default_factory=dict)


class RiskResult(BaseModel):
    decision: str
    risk_score: int
    risk_level: str


class Explanation(BaseModel):
    summary: str
    recommendation: str
    reviewer_note: str


class ApiFinding(BaseModel):
    """Public finding shape. Maps internal Finding.code -> type."""

    type: str
    severity: str
    score: int
    message: str
    parameter: Optional[str] = None
    evidence: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_finding(cls, f: "Finding") -> "ApiFinding":
        return cls(
            type=f.code,
            severity=f.severity,
            score=f.score,
            message=f.message,
            parameter=f.parameter,
            evidence=f.evidence,
        )


class DemoScenario(BaseModel):
    scenario_id: str
    title: str
    description: str


class VerificationListItem(BaseModel):
    analysis_id: str
    decision: str
    risk_score: int
    risk_level: str
    material_code: Optional[str] = None
    material_name: Optional[str] = None
    supplier: Optional[str] = None
    summary: Optional[str] = None
    source: str = "DEMO_SAMPLE"
    scenario_id: Optional[str] = None
    created_at: str


class UserPublic(BaseModel):
    email: str
    name: str
    organization: Optional[str] = None
    role: Optional[str] = None
    created_at: Optional[str] = None


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: str = Field(..., min_length=3, max_length=200)
    organization: str = Field(..., min_length=1, max_length=160)
    role: str = Field(..., min_length=1, max_length=80)
    password: str = Field(..., min_length=6, max_length=200)
    confirm_password: str = Field(..., min_length=6, max_length=200)

    @field_validator("name", "organization", "role")
    @classmethod
    def _strip_required(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Field cannot be empty.")
        return v

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("Please enter a valid work email address.")
        return v

    @field_validator("role")
    @classmethod
    def _check_role(cls, v: str) -> str:
        if v not in _ALLOWED_ROLES:
            # Accept unknown roles as "Other" rather than failing — keeps the
            # contract permissive for now without losing the field.
            return "Other"
        return v


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=1, max_length=200)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("Please enter a valid email address.")
        return v


class AuthResponse(BaseModel):
    user: UserPublic
    token: str
    token_type: str = "bearer"


class VerificationResult(BaseModel):
    analysis_id: str
    decision: str
    risk_score: int
    risk_level: str
    summary: str
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    findings: List[ApiFinding] = Field(default_factory=list)
    recommendation: str
    reviewer_note: str
    human_review_required: bool
    source: str = "DEMO_SAMPLE"
    scenario_id: Optional[str] = None
    created_at: str
