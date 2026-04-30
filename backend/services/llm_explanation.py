"""GitHub Models explanation provider.

The LLM is asked to produce a short, human-readable summary of the verification
result. It NEVER decides APPROVED / NEEDS_REVIEW / REJECTED — those come from
the deterministic risk engine. The model also cannot invent evidence; we only
feed it the findings + extracted_fields the validator already produced.

Any failure (missing config, network error, bad JSON, missing keys) returns
None so the caller can fall back to the deterministic template explanation.
Secrets are never logged.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

import requests

from backend.config import settings

logger = logging.getLogger(__name__)

_REQUEST_TIMEOUT = 20.0  # seconds

SYSTEM_PROMPT = (
    "You are a QA material verification assistant. You summarize deterministic "
    "verification findings for a human QA reviewer. Use only the provided "
    "findings and evidence. Do not invent facts. Do not override the provided "
    "decision. Use concise QA-style language. Avoid generic phrases unless the finding requires it. Prefer concrete, evidence-grounded recommendations such as hold, quarantine, do not release, or escalate to QA, based strictly on the provided findings.Return concise JSON only."
)

_USER_INSTRUCTIONS = (
    "Return ONLY a JSON object with exactly these keys:\n"
    '  "summary" (string): one or two sentences explaining the decision.\n'
    '  "recommendation" (string): one sentence telling the QA reviewer what to do next.\n'
    '  "reviewer_note" (string): brief reviewer-facing note listing the findings to verify.\n'
    "Do NOT change or contradict 'decision', 'risk_score', or 'risk_level'. "
    "Do NOT invent fields beyond what is in 'findings' and 'extracted_fields'.\n"
    "Output JSON only, no prose, no code fences."
)

_COA_KEYS = (
    "material_name",
    "material_code",
    "supplier",
    "batch_no",
    "mfg_date",
    "expiry_date",
    "quantity",
    "coa_no",
    "conclusion",
)
_LABEL_KEYS = (
    "material_name",
    "material_code",
    "supplier",
    "batch_no",
    "mfg_date",
    "expiry_date",
    "quantity",
)


def _finding_dict(f: Any) -> dict:
    if hasattr(f, "model_dump"):
        return f.model_dump()
    if hasattr(f, "code"):
        return {
            "code": f.code,
            "severity": f.severity,
            "score": f.score,
            "message": f.message,
            "parameter": getattr(f, "parameter", None),
            "evidence": getattr(f, "evidence", {}),
        }
    return dict(f)


def _trim_extracted(extracted_fields: Optional[dict]) -> dict:
    coa = (extracted_fields or {}).get("coa") or {}
    label = (extracted_fields or {}).get("label") or {}
    return {
        "coa": {k: coa.get(k) for k in _COA_KEYS if k in coa},
        "label": {k: label.get(k) for k in _LABEL_KEYS if k in label},
        "test_results": coa.get("test_results", []),
    }


def _build_user_message(
    *,
    decision: str,
    risk_score: int,
    risk_level: str,
    findings: list,
    extracted_fields: Optional[dict],
) -> str:
    payload = {
        "decision": decision,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "findings": [_finding_dict(f) for f in findings],
        "extracted_fields": _trim_extracted(extracted_fields),
    }
    return f"{_USER_INSTRUCTIONS}\n\nINPUT:\n{json.dumps(payload, ensure_ascii=False)}"


def _resolve_model_id(model: str, endpoint: str) -> str:
    """Auto-prefix bare model names on the new GitHub Models endpoint."""
    if "/" in model:
        return model
    if "models.github.ai" in endpoint:
        return f"openai/{model}"
    return model


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)


def _safe_parse_json(text: Any) -> Optional[dict]:
    if not isinstance(text, str) or not text.strip():
        return None
    s = text.strip()
    if s.startswith("```"):
        s = _FENCE_RE.sub("", s).strip()
    try:
        parsed = json.loads(s)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _shape_response(parsed: dict) -> Optional[dict]:
    summary = str(parsed.get("summary") or "").strip()
    recommendation = str(parsed.get("recommendation") or "").strip()
    reviewer_note = str(parsed.get("reviewer_note") or "").strip()
    if not (summary and recommendation and reviewer_note):
        return None
    return {
        "summary": summary,
        "recommendation": recommendation,
        "reviewer_note": reviewer_note,
    }


def generate_llm_explanation(
    *,
    decision: str,
    risk_score: int,
    risk_level: str,
    findings: list,
    extracted_fields: Optional[dict] = None,
) -> Optional[dict]:
    """Call GitHub Models and return {summary, recommendation, reviewer_note}.

    Returns None on any failure so the caller can fall back to the template.
    """
    if not settings.github_models_configured:
        return None

    endpoint = settings.github_models_endpoint.rstrip("/")
    url = f"{endpoint}/chat/completions"
    model_id = _resolve_model_id(settings.github_model, endpoint)

    body = {
        "model": model_id,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": _build_user_message(
                    decision=decision,
                    risk_score=risk_score,
                    risk_level=risk_level,
                    findings=findings,
                    extracted_fields=extracted_fields,
                ),
            },
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=_REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        logger.warning("LLM explanation network error (%s); using template fallback",
                       type(exc).__name__)
        return None

    if resp.status_code >= 400:
        logger.warning(
            "LLM explanation HTTP %s; using template fallback", resp.status_code
        )
        return None

    try:
        data = resp.json()
    except ValueError:
        logger.warning("LLM explanation: response was not JSON; using template fallback")
        return None

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        logger.warning("LLM explanation: unexpected response shape; using template fallback")
        return None

    parsed = _safe_parse_json(content)
    if parsed is None:
        logger.warning("LLM explanation: model output was not valid JSON; using template fallback")
        return None

    shaped = _shape_response(parsed)
    if shaped is None:
        logger.warning("LLM explanation: missing required keys; using template fallback")
        return None

    return shaped
