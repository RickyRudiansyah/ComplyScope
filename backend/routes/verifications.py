"""Verification endpoints.

Includes:
  - GET  /api/verifications              list history
  - GET  /api/verifications/{analysis_id} fetch one record
  - POST /api/verifications              real upload (Azure DI + parser)

The decision is always computed by the deterministic validator + risk engine.
The LLM only writes summary/recommendation/reviewer_note (with a template
fallback). Real uploads are stored with source = REAL_UPLOAD and scenario_id = None.
"""
from __future__ import annotations

import asyncio
import logging
import secrets
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.config import settings
from backend.database import fetch_verification_log, insert_verification_log, list_verification_logs
from backend.schemas import ApiFinding, VerificationListItem, VerificationResult
from backend.services.azure_doc_intel import (
    DocIntelCallError,
    DocIntelNotConfigured,
    analyze_document,
)
from backend.services.explanation import explain
from backend.services.parser import parse_coa, parse_label
from backend.services.risk_engine import decide
from backend.services.validator import validate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/verifications", tags=["verifications"])


def _human_review_required(decision: str) -> bool:
    return decision in ("NEEDS_REVIEW", "REJECTED")


def _generate_analysis_id(now: datetime) -> str:
    return f"ANL-{now.strftime('%Y%m%d-%H%M%S')}-{secrets.token_hex(2)}"


@router.get("", response_model=List[VerificationListItem])
def list_verifications() -> List[VerificationListItem]:
    return [VerificationListItem(**r) for r in list_verification_logs()]


@router.post("", response_model=VerificationResult)
async def create_verification(
    coa_file: UploadFile = File(...),
    label_file: UploadFile = File(...),
) -> VerificationResult:
    """Real upload pipeline:

    1. Validate inputs.
    2. Send each file to Azure Document Intelligence (prebuilt-layout).
    3. Parse the DI result into canonical COA + label fields.
    4. Run validator + risk engine.
    5. Run explanation layer (LLM with template fallback).
    6. Persist with source = REAL_UPLOAD, scenario_id = None.
    """
    if not settings.doc_intel_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "Azure Document Intelligence is not configured. "
                "Set USE_AZURE_DOC_INTEL=true and provide AZURE_DOC_INTEL_ENDPOINT "
                "and AZURE_DOC_INTEL_KEY."
            ),
        )

    coa_bytes = await coa_file.read()
    label_bytes = await label_file.read()
    if not coa_bytes or not label_bytes:
        raise HTTPException(
            status_code=400,
            detail="Both 'coa_file' and 'label_file' are required and must be non-empty.",
        )

    try:
        coa_di, label_di = await asyncio.gather(
            asyncio.to_thread(
                analyze_document,
                coa_bytes,
                filename=coa_file.filename,
                content_type=coa_file.content_type,
            ),
            asyncio.to_thread(
                analyze_document,
                label_bytes,
                filename=label_file.filename,
                content_type=label_file.content_type,
            ),
        )
    except DocIntelNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except DocIntelCallError as exc:
        logger.warning("Azure DI call failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Azure Document Intelligence call failed. Please retry.",
        ) from exc

    coa = parse_coa(coa_di)
    label = parse_label(label_di)
    extracted_fields = {"coa": coa, "label": label}

    findings = validate(extracted_fields)
    risk = decide(findings)
    explanation = explain(findings, risk, extracted_fields=extracted_fields)
    api_findings = [ApiFinding.from_finding(f) for f in findings]

    now = datetime.now(timezone.utc).replace(microsecond=0)
    analysis_id = _generate_analysis_id(now)
    created_at = now.isoformat()

    insert_verification_log(
        analysis_id=analysis_id,
        decision=risk.decision,
        risk_score=risk.risk_score,
        risk_level=risk.risk_level,
        material_code=coa.get("material_code"),
        material_name=coa.get("material_name"),
        supplier=coa.get("supplier"),
        extracted_fields=extracted_fields,
        findings=[f.model_dump() for f in api_findings],
        summary=explanation.summary,
        recommendation=explanation.recommendation,
        reviewer_note=explanation.reviewer_note,
        source="REAL_UPLOAD",
        scenario_id=None,
        created_at=created_at,
    )

    return VerificationResult(
        analysis_id=analysis_id,
        decision=risk.decision,
        risk_score=risk.risk_score,
        risk_level=risk.risk_level,
        summary=explanation.summary,
        extracted_fields=extracted_fields,
        findings=api_findings,
        recommendation=explanation.recommendation,
        reviewer_note=explanation.reviewer_note,
        human_review_required=_human_review_required(risk.decision),
        source="REAL_UPLOAD",
        scenario_id=None,
        created_at=created_at,
    )


@router.get("/{analysis_id}", response_model=VerificationResult)
def get_verification(analysis_id: str) -> VerificationResult:
    row = fetch_verification_log(analysis_id)
    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Verification '{analysis_id}' not found",
        )
    decision = row["decision"]
    return VerificationResult(
        analysis_id=row["analysis_id"],
        decision=decision,
        risk_score=row["risk_score"],
        risk_level=row["risk_level"],
        summary=row.get("summary") or "",
        extracted_fields=row.get("extracted_fields") or {},
        findings=[ApiFinding(**f) for f in (row.get("findings") or [])],
        recommendation=row.get("recommendation") or "",
        reviewer_note=row.get("reviewer_note") or "",
        human_review_required=_human_review_required(decision),
        source=row.get("source") or "DEMO_SAMPLE",
        scenario_id=row.get("scenario_id"),
        created_at=row.get("created_at") or "",
    )
