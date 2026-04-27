"""Pydantic response schemas for the VeriTrace Lite API."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


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
    aliases: List[str] = []


class ApprovedSupplier(BaseModel):
    supplier_name: str
    status: str


class MaterialDetail(MaterialBase):
    specs: List[MaterialSpec] = []
    approved_suppliers: List[ApprovedSupplier] = []


class Supplier(BaseModel):
    supplier_name: str
    status: str
