"""Verification history endpoints."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException

from backend.database import fetch_verification_log, list_verification_logs
from backend.schemas import ApiFinding, VerificationListItem, VerificationResult

router = APIRouter(prefix="/verifications", tags=["verifications"])


def _human_review_required(decision: str) -> bool:
    return decision in ("NEEDS_REVIEW", "REJECTED")


@router.get("", response_model=List[VerificationListItem])
def list_verifications() -> List[VerificationListItem]:
    return [VerificationListItem(**r) for r in list_verification_logs()]


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
        created_at=row.get("created_at") or "",
    )
