"""Explanation builder.

Produces summary, recommendation, reviewer_note for a verification result.

Two providers, in this order:
  1. GitHub Models (if USE_LLM_EXPLANATION + GITHUB_TOKEN are configured).
  2. Deterministic template fallback (always available).

The LLM never decides APPROVED / NEEDS_REVIEW / REJECTED and never invents
evidence. Decision, risk_score, risk_level, and findings come from the
deterministic risk engine and are passed in here unchanged.
"""
from __future__ import annotations

import logging
from typing import Iterable, Optional

from backend.schemas import Explanation, Finding, RiskResult
from backend.services.llm_explanation import generate_llm_explanation

logger = logging.getLogger(__name__)


_CODE_LABELS = {
    "MISSING_REQUIRED_FIELD": "missing required field",
    "BATCH_MISMATCH": "batch number mismatch",
    "SUPPLIER_NOT_APPROVED": "unapproved supplier",
    "EXPIRY_BELOW_THRESHOLD": "remaining shelf life below threshold",
    "MISSING_REQUIRED_TEST": "missing required test",
    "TEST_RESULT_OUT_OF_SPEC": "out-of-specification test result",
    "QUANTITY_MISMATCH": "quantity mismatch",
}

_DECISION_HEADER = {
    "APPROVED": "Verification passed. No blocking issues detected.",
    "NEEDS_REVIEW": "Verification flagged for human review.",
    "REJECTED": "Verification failed; the batch should not be released.",
}

_DECISION_RECOMMENDATION = {
    "APPROVED": "Proceed with the standard QA release procedure.",
    "NEEDS_REVIEW": "Forward findings to the QA reviewer before any release decision.",
    "REJECTED": (
        "Do not release. Quarantine the batch and trigger deviation handling."
    ),
}


def _pluralize(label: str, count: int) -> str:
    if count <= 1:
        return label
    if label.endswith("s"):
        return label
    return label + "s"


def _template_explain(findings: list[Finding], risk: RiskResult) -> Explanation:
    header = _DECISION_HEADER.get(risk.decision, risk.decision)
    recommendation = _DECISION_RECOMMENDATION.get(risk.decision, "")

    if not findings:
        return Explanation(
            summary=(
                f"{header} Risk score {risk.risk_score} ({risk.risk_level})."
            ),
            recommendation=recommendation,
            reviewer_note="No findings recorded. No reviewer action required.",
        )

    counts: dict[str, int] = {}
    for f in findings:
        counts[f.code] = counts.get(f.code, 0) + 1
    counts_text = ", ".join(
        f"{n} {_pluralize(_CODE_LABELS.get(code, code), n)}"
        for code, n in counts.items()
    )

    bullet_lines = [
        f"- [{f.severity}] {f.code}: {f.message}" for f in findings
    ]
    findings_block = "\n".join(bullet_lines)

    summary = (
        f"{header} Risk score {risk.risk_score} ({risk.risk_level}). "
        f"Findings: {counts_text}."
    )
    reviewer_note = (
        "Reviewer should verify the following findings before deciding:\n"
        f"{findings_block}"
    )

    return Explanation(
        summary=summary,
        recommendation=recommendation,
        reviewer_note=reviewer_note,
    )


def explain(
    findings: Iterable[Finding],
    risk: RiskResult,
    extracted_fields: Optional[dict] = None,
) -> Explanation:
    """Return an Explanation for the given verification.

    Tries the configured LLM provider first (currently GitHub Models). Falls
    back to the deterministic template on any failure (missing config,
    network error, invalid JSON, or missing keys). The decision and findings
    are never altered by this function.
    """
    findings_list = list(findings)

    try:
        llm_payload = generate_llm_explanation(
            decision=risk.decision,
            risk_score=risk.risk_score,
            risk_level=risk.risk_level,
            findings=findings_list,
            extracted_fields=extracted_fields,
        )
    except Exception as exc:  # defensive — provider must never crash the pipeline
        logger.warning(
            "LLM explanation raised %s; using template fallback", type(exc).__name__
        )
        llm_payload = None

    if llm_payload:
        try:
            return Explanation(**llm_payload)
        except Exception as exc:
            logger.warning(
                "LLM explanation could not be coerced into Explanation (%s); "
                "using template fallback",
                type(exc).__name__,
            )

    return _template_explain(findings_list, risk)
