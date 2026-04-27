"""Pydantic response schemas for the VeriTrace Lite API."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


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


class MaterialDetail(MaterialBase):
    specs: List[MaterialSpec] = Field(default_factory=list)
    approved_suppliers: List[ApprovedSupplier] = Field(default_factory=list)


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
