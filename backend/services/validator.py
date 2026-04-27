"""Deterministic validator for COA + label extracted fields.

Produces a list of Finding objects. Does NOT decide; the risk engine does.
Required tests come from material_specs (loaded from DB), never hardcoded.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Optional

from backend.database import (
    fetch_approved_suppliers,
    fetch_material,
    fetch_material_specs,
)
from backend.schemas import Finding


REQUIRED_COA_FIELDS = (
    "material_name",
    "material_code",
    "supplier",
    "batch_no",
    "expiry_date",
    "coa_no",
)

POSITIVE_TOKENS = {
    "positive",
    "conforms",
    "complies",
    "pass",
    "passes",
    "yes",
    "ok",
}

SEVERITY_BY_CRITICALITY = {
    "CRITICAL": "CRITICAL",
    "HIGH": "HIGH",
    "MEDIUM": "MEDIUM",
    "LOW": "LOW",
}

OOS_SCORE_BY_CRITICALITY = {
    "CRITICAL": 40,
    "HIGH": 30,
    "MEDIUM": 20,
    "LOW": 10,
}

_DATE_FORMATS = (
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
    "%d %b %Y",
    "%d %B %Y",
)

_QTY_RE = re.compile(r"([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z%]+)?")


def _normalize(value: Any) -> str:
    return str(value or "").strip().lower()


_TEXT_EQ_TRIM = " \t\r\n.,;:!"


def _normalize_text_equals(value: Any) -> str:
    """Looser normalization for text_equals comparisons.

    Lowercases, strips whitespace, collapses internal runs of whitespace,
    and trims trailing punctuation like a stray period or comma. Intentionally
    NOT a fuzzy match — only forgives cosmetic differences.
    """
    text = str(value or "").strip().strip(_TEXT_EQ_TRIM).lower()
    return re.sub(r"\s+", " ", text)


def _is_blank(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    return False


def _parse_date(value: Any) -> Optional[date]:
    if not value:
        return None
    text = str(value).strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _normalize_quantity(value: Any) -> tuple[Optional[float], str]:
    if not value:
        return None, ""
    m = _QTY_RE.search(str(value))
    if not m:
        return None, ""
    num = float(m.group(1).replace(",", "."))
    unit = (m.group(2) or "").strip().lower()
    return num, unit


def _try_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    text = str(value).strip().replace(",", ".")
    text = re.sub(r"^[<>=≤≥]+\s*", "", text)
    try:
        return float(text)
    except ValueError:
        return None


def _find_test_result(test_results: list[dict], aliases: list[str]) -> Optional[dict]:
    norm_aliases = {_normalize(a) for a in aliases if a}
    for tr in test_results or []:
        if _normalize(tr.get("parameter")) in norm_aliases:
            return tr
    return None


def _check_spec(spec: dict, result_value: Any) -> tuple[bool, str]:
    spec_type = (spec.get("spec_type") or "").strip().lower()
    if not spec_type:
        # Malformed spec: no spec_type. Skip without producing a finding.
        return True, ""

    if spec_type == "text_equals":
        expected = spec.get("expected_text")
        ok = _normalize_text_equals(result_value) == _normalize_text_equals(expected)
        return ok, f"expected '{expected}', got '{result_value}'"
    if spec_type == "positive":
        ok = _normalize(result_value) in POSITIVE_TOKENS
        return ok, f"expected positive/conforming result, got '{result_value}'"

    num = _try_float(result_value)
    if num is None:
        return False, f"non-numeric result '{result_value}' for numeric spec"
    if spec_type == "range":
        lo, hi = spec.get("spec_min"), spec.get("spec_max")
        if lo is None or hi is None:
            return True, ""
        return lo <= num <= hi, f"result {num} outside range [{lo}, {hi}]"
    if spec_type == "max":
        hi = spec.get("spec_max")
        if hi is None:
            return True, ""
        return num <= hi, f"result {num} above max {hi}"
    if spec_type == "min":
        lo = spec.get("spec_min")
        if lo is None:
            return True, ""
        return num >= lo, f"result {num} below min {lo}"
    # Unknown spec_type: skip silently rather than guess.
    return True, ""


def _check_required_fields(coa: dict) -> list[Finding]:
    findings: list[Finding] = []
    for field in REQUIRED_COA_FIELDS:
        if _is_blank(coa.get(field)):
            findings.append(
                Finding(
                    code="MISSING_REQUIRED_FIELD",
                    severity="MEDIUM",
                    score=15,
                    message=f"Required COA field '{field}' is missing or empty.",
                    evidence={"field": field},
                )
            )
    return findings


def _check_batch(coa: dict, label: dict) -> list[Finding]:
    coa_b = coa.get("batch_no")
    lbl_b = label.get("batch_no") if label else None
    if _is_blank(coa_b) or _is_blank(lbl_b):
        return []
    if _normalize(coa_b) != _normalize(lbl_b):
        return [
            Finding(
                code="BATCH_MISMATCH",
                severity="CRITICAL",
                score=35,
                message=(
                    f"Batch number on COA ('{coa_b}') does not match label ('{lbl_b}')."
                ),
                evidence={"coa_batch": coa_b, "label_batch": lbl_b},
            )
        ]
    return []


def _check_supplier(coa: dict, approved: list[str]) -> list[Finding]:
    supplier = coa.get("supplier")
    if _is_blank(supplier):
        return []
    norm_approved = {_normalize(s) for s in approved}
    if _normalize(supplier) in norm_approved:
        return []
    return [
        Finding(
            code="SUPPLIER_NOT_APPROVED",
            severity="HIGH",
            score=30,
            message=(
                f"Supplier '{supplier}' is not on the approved supplier list "
                f"for this material."
            ),
            evidence={"supplier": supplier, "approved_suppliers": list(approved)},
        )
    ]


def _check_expiry(coa: dict, material: Optional[dict], today: date) -> list[Finding]:
    if not material or not material.get("min_shelf_life_days"):
        return []
    expiry = _parse_date(coa.get("expiry_date"))
    if expiry is None:
        return []
    threshold = int(material["min_shelf_life_days"])
    days_left = (expiry - today).days
    if days_left >= threshold:
        return []
    return [
        Finding(
            code="EXPIRY_BELOW_THRESHOLD",
            severity="HIGH",
            score=20,
            message=(
                f"Remaining shelf life ({days_left} days) is below the required "
                f"minimum of {threshold} days."
            ),
            evidence={
                "expiry_date": coa.get("expiry_date"),
                "days_left": days_left,
                "min_shelf_life_days": threshold,
            },
        )
    ]


def _check_tests(coa: dict, specs: list[dict]) -> list[Finding]:
    findings: list[Finding] = []
    test_results = coa.get("test_results") or []
    for spec in specs:
        if not spec.get("required"):
            continue
        parameter = spec.get("parameter")
        if _is_blank(parameter):
            # Malformed spec row without a parameter name — skip.
            continue
        if _is_blank(spec.get("spec_type")):
            # Malformed spec row without a spec_type — skip; we cannot evaluate it.
            continue

        aliases = list(spec.get("aliases") or [])
        if parameter not in aliases:
            aliases = [parameter] + aliases

        result = _find_test_result(test_results, aliases)
        if result is None:
            findings.append(
                Finding(
                    code="MISSING_REQUIRED_TEST",
                    severity="HIGH",
                    score=25,
                    message=(
                        f"Required test '{parameter}' is missing from COA results."
                    ),
                    parameter=parameter,
                    evidence={"parameter": parameter},
                )
            )
            continue

        passes, reason = _check_spec(spec, result.get("result"))
        if passes:
            continue
        criticality = (spec.get("criticality") or "MEDIUM").upper()
        severity = SEVERITY_BY_CRITICALITY.get(criticality, "MEDIUM")
        score = OOS_SCORE_BY_CRITICALITY.get(criticality, 20)
        findings.append(
            Finding(
                code="TEST_RESULT_OUT_OF_SPEC",
                severity=severity,
                score=score,
                message=f"Test '{parameter}' is out of specification: {reason}.",
                parameter=parameter,
                evidence={
                    "parameter": parameter,
                    "result": result.get("result"),
                    "spec_type": spec.get("spec_type"),
                    "spec_min": spec.get("spec_min"),
                    "spec_max": spec.get("spec_max"),
                    "expected_text": spec.get("expected_text"),
                    "unit": spec.get("unit"),
                    "criticality": criticality,
                },
            )
        )
    return findings


def _check_quantity(coa: dict, label: dict) -> list[Finding]:
    coa_q = coa.get("quantity")
    lbl_q = label.get("quantity") if label else None
    if _is_blank(coa_q) or _is_blank(lbl_q):
        return []
    coa_num, coa_unit = _normalize_quantity(coa_q)
    lbl_num, lbl_unit = _normalize_quantity(lbl_q)
    if coa_num is None or lbl_num is None:
        return []
    if coa_num == lbl_num and coa_unit == lbl_unit:
        return []
    return [
        Finding(
            code="QUANTITY_MISMATCH",
            severity="MEDIUM",
            score=15,
            message=f"Quantity on COA ('{coa_q}') does not match label ('{lbl_q}').",
            evidence={"coa_quantity": coa_q, "label_quantity": lbl_q},
        )
    ]


def validate(extracted_fields: dict, today: Optional[date] = None) -> list[Finding]:
    """Run all deterministic checks and return collected findings."""
    coa = (extracted_fields or {}).get("coa") or {}
    label = (extracted_fields or {}).get("label") or {}
    today = today or date.today()

    findings: list[Finding] = []
    findings.extend(_check_required_fields(coa))
    findings.extend(_check_batch(coa, label))
    findings.extend(_check_quantity(coa, label))

    material_code = coa.get("material_code") or label.get("material_code")
    if material_code:
        material = fetch_material(material_code)
        approved = fetch_approved_suppliers(material_code)
        specs = fetch_material_specs(material_code)
        findings.extend(_check_supplier(coa, approved))
        findings.extend(_check_expiry(coa, material, today))
        findings.extend(_check_tests(coa, specs))

    return findings
