"""Demo scenario endpoints.

These endpoints exercise the full real pipeline (validator + risk engine +
template explanation) using cached extracted_fields. The cached file does NOT
store any decision; the decision is computed every time the endpoint runs.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException

from backend.database import insert_verification_log
from backend.schemas import ApiFinding, DemoScenario, VerificationResult
from backend.services.demo_service import get_scenario, list_scenarios
from backend.services.explanation import explain
from backend.services.risk_engine import decide
from backend.services.validator import validate

router = APIRouter(tags=["demo"])


def _generate_analysis_id(now: datetime) -> str:
    return f"ANL-{now.strftime('%Y%m%d-%H%M%S')}-{secrets.token_hex(2)}"


def _human_review_required(decision: str) -> bool:
    return decision in ("NEEDS_REVIEW", "REJECTED")


@router.get("/demo-scenarios", response_model=List[DemoScenario])
def list_demo_scenarios() -> List[DemoScenario]:
    return [DemoScenario(**s) for s in list_scenarios()]


@router.post("/demo-scenarios/{scenario_id}/run", response_model=VerificationResult)
def run_demo_scenario(scenario_id: str) -> VerificationResult:
    scenario = get_scenario(scenario_id)
    if scenario is None:
        raise HTTPException(
            status_code=404,
            detail=f"Demo scenario '{scenario_id}' not found",
        )

    extracted_fields = scenario.get("extracted_fields") or {}

    findings = validate(extracted_fields)
    risk = decide(findings)
    explanation = explain(findings, risk, extracted_fields=extracted_fields)
    api_findings = [ApiFinding.from_finding(f) for f in findings]

    coa = extracted_fields.get("coa") or {}
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
        source="DEMO_SAMPLE",
        scenario_id=scenario_id,
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
        source="DEMO_SAMPLE",
        scenario_id=scenario_id,
        created_at=created_at,
    )
