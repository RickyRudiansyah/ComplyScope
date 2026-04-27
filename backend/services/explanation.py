"""Template-based explanation builder. No LLM calls; no hallucination.

Produces summary, recommendation, reviewer_note strictly from the supplied
findings and risk decision. Azure OpenAI may later rewrite these for tone, but
the underlying facts stay deterministic.
"""
from __future__ import annotations

from typing import Iterable

from backend.schemas import Explanation, Finding, RiskResult


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


def explain(findings: Iterable[Finding], risk: RiskResult) -> Explanation:
    findings_list = list(findings)
    header = _DECISION_HEADER.get(risk.decision, risk.decision)
    recommendation = _DECISION_RECOMMENDATION.get(risk.decision, "")

    if not findings_list:
        return Explanation(
            summary=(
                f"{header} Risk score {risk.risk_score} ({risk.risk_level})."
            ),
            recommendation=recommendation,
            reviewer_note="No findings recorded. No reviewer action required.",
        )

    counts: dict[str, int] = {}
    for f in findings_list:
        counts[f.code] = counts.get(f.code, 0) + 1
    counts_text = ", ".join(
        f"{n} {_pluralize(_CODE_LABELS.get(code, code), n)}"
        for code, n in counts.items()
    )

    bullet_lines = [
        f"- [{f.severity}] {f.code}: {f.message}" for f in findings_list
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
