"""Deterministic risk scoring + decision.

Decision is computed only from validator findings. Azure OpenAI never decides.
"""
from __future__ import annotations

from typing import Iterable

from backend.schemas import Finding, RiskResult


def _decision_for(score: int, has_critical_oos: bool) -> str:
    if has_critical_oos:
        return "REJECTED"
    if score <= 20:
        return "APPROVED"
    if score <= 59:
        return "NEEDS_REVIEW"
    return "REJECTED"


def _level_for(score: int) -> str:
    if score <= 20:
        return "LOW"
    if score <= 59:
        return "MEDIUM"
    return "HIGH"


def decide(findings: Iterable[Finding]) -> RiskResult:
    findings_list = list(findings)
    raw_score = sum(int(f.score) for f in findings_list)
    score = min(raw_score, 100)

    has_critical_oos = any(
        f.code == "TEST_RESULT_OUT_OF_SPEC"
        and (f.severity or "").upper() == "CRITICAL"
        for f in findings_list
    )

    risk_level = _level_for(score)
    # If a CRITICAL out-of-spec forced REJECTED, the risk level must reflect that
    # severity even when the additive score is still within the MEDIUM band.
    if has_critical_oos:
        risk_level = "HIGH"

    return RiskResult(
        decision=_decision_for(score, has_critical_oos),
        risk_score=score,
        risk_level=risk_level,
    )
