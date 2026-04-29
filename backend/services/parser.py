"""COA + label parser for Azure Document Intelligence layout output.

Converts the normalized DI result (see :mod:`backend.services.azure_doc_intel`)
into the canonical extracted_fields shape consumed by the validator and the
risk engine.

Design goals:
  - Do not hallucinate missing values: anything not found stays None.
  - Required tests come from material_specs; the parser never decides which
    test is required and never globally hardcodes "Assay".
  - Robust to wrapped values (e.g. supplier name spanning two lines) AND to
    multiple inline labels on a single line (e.g. a meta-grid row that DI
    returns flattened to a single line of text).
  - Generic post-extraction cleanup (URLs, page markers, mojibake, trailing
    layout footer) — no hardcoded "MATERIAL LABEL" or specific localhost URL.
  - Field aliases are loaded from backend/data/field_aliases.json and
    table_header_aliases.json. Both files may use a wrapper
    `{"aliases": {...}}` or a flat root.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
FIELD_ALIASES_PATH = DATA_DIR / "field_aliases.json"
TABLE_HEADER_ALIASES_PATH = DATA_DIR / "table_header_aliases.json"


# Built-in default mapping of label-text (lowercased, no colon) to the
# canonical field(s) it sets. Some labels populate two fields (e.g.
# "Product Name" sets both product_name and material_name).
_DEFAULT_COA_LABEL_MAP: dict[str, list[str]] = {
    "document type": ["document_type"],
    "coa no": ["coa_no"],
    "certificate no": ["coa_no"],
    "certificate number": ["coa_no"],
    "issue date": ["issue_date"],
    "page": ["page"],
    "product name": ["product_name", "material_name"],
    "material name": ["material_name", "product_name"],
    "description": ["material_name"],
    "product description": ["material_name"],
    "material code": ["material_code"],
    "category": ["category"],
    "supplier": ["supplier"],
    "vendor": ["supplier"],
    "manufacturer": ["manufacturer"],
    "manufacturing site": ["manufacturer"],
    "produced by": ["manufacturer"],
    "mfg site": ["manufacturer"],
    "batch no": ["batch_no"],
    "batch number": ["batch_no"],
    "lot no": ["batch_no"],
    "lot number": ["batch_no"],
    "batch/lot": ["batch_no"],
    "mfg date": ["mfg_date"],
    "manufacturing date": ["mfg_date"],
    "production date": ["mfg_date"],
    "expiry date": ["expiry_date"],
    "expiration date": ["expiry_date"],
    "retest date": ["expiry_date"],
    "valid until": ["expiry_date"],
    "quantity": ["quantity"],
    "size": ["quantity"],
    "package size": ["quantity"],
    "storage condition": ["storage_condition"],
    "storage": ["storage_condition"],
    "conclusion": ["conclusion"],
    "authorized by": ["authorized_by"],
    # Terminator label — recognized so it bounds the previous value, but it
    # does not populate any canonical field. Generic across COA signoff blocks.
    "signature": [],
}

# Labels we recognize on the much smaller material label.
_DEFAULT_LABEL_LABEL_MAP: dict[str, list[str]] = {
    "material name": ["material_name"],
    "product name": ["material_name"],
    "description": ["material_name"],
    "material code": ["material_code"],
    "batch no": ["batch_no"],
    "batch number": ["batch_no"],
    "lot no": ["batch_no"],
    "lot number": ["batch_no"],
    "supplier": ["supplier"],
    "vendor": ["supplier"],
    "quantity": ["quantity"],
    "mfg date": ["mfg_date"],
    "manufacturing date": ["mfg_date"],
    "expiry date": ["expiry_date"],
    "expiration date": ["expiry_date"],
    "storage condition": ["storage_condition"],
    "storage": ["storage_condition"],
}

# Section/heading lines that flush the in-progress value but are not labels
# themselves. We deliberately do NOT include 'certificate of analysis' or
# 'material label' here, because those are also legitimate values for the
# Document Type field.
_SECTION_HEADINGS = {
    "product information",
    "results of analysis",
}

_COA_FIELD_ORDER = (
    "document_type",
    "coa_no",
    "issue_date",
    "page",
    "product_name",
    "material_name",
    "material_code",
    "category",
    "supplier",
    "manufacturer",
    "batch_no",
    "mfg_date",
    "expiry_date",
    "quantity",
    "storage_condition",
    "test_results",
    "conclusion",
    "authorized_by",
)
_LABEL_FIELD_ORDER = (
    "material_name",
    "material_code",
    "batch_no",
    "supplier",
    "quantity",
    "mfg_date",
    "expiry_date",
    "storage_condition",
)

_DATE_FIELDS = ("issue_date", "mfg_date", "expiry_date")


# ---------- Alias loading -----------------------------------------------------


def _load_alias_dict(path: Path) -> dict[str, list[str]]:
    """Load a JSON alias file; accept either a 'aliases' wrapper or flat root."""
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}
    if isinstance(data, dict) and "aliases" in data and isinstance(data["aliases"], dict):
        return data["aliases"]
    if isinstance(data, dict):
        return data
    return {}


def _normalize_label(text: str) -> str:
    s = (text or "").strip().rstrip(":").strip().lower()
    return re.sub(r"\s+", " ", s)


def _build_label_map(
    default_map: dict[str, list[str]],
    aliases_json: dict[str, list[str]],
) -> dict[str, list[str]]:
    """Merge built-in defaults with the JSON aliases."""
    out: dict[str, list[str]] = {k: list(v) for k, v in default_map.items()}
    for canonical, aliases in (aliases_json or {}).items():
        if not isinstance(aliases, list):
            continue
        for alias in aliases:
            key = _normalize_label(alias)
            if not key:
                continue
            existing = out.get(key, [])
            if canonical not in existing:
                existing = list(existing) + [canonical]
            out[key] = existing
    return out


_FIELD_ALIASES_JSON = _load_alias_dict(FIELD_ALIASES_PATH)
_TABLE_HEADER_ALIASES_JSON = _load_alias_dict(TABLE_HEADER_ALIASES_PATH)
_COA_LABEL_LOOKUP = _build_label_map(_DEFAULT_COA_LABEL_MAP, _FIELD_ALIASES_JSON)
_LABEL_LABEL_LOOKUP = _build_label_map(_DEFAULT_LABEL_LABEL_MAP, _FIELD_ALIASES_JSON)


def _build_header_lookup(aliases_json: dict[str, list[str]]) -> dict[str, str]:
    out: dict[str, str] = {}
    for canonical, aliases in (aliases_json or {}).items():
        out[_normalize_label(canonical)] = canonical
        if not isinstance(aliases, list):
            continue
        for alias in aliases:
            key = _normalize_label(alias)
            if key and key not in out:
                out[key] = canonical
    builtin = {
        "parameter": "parameter",
        "test": "parameter",
        "analysis": "parameter",
        "test item": "parameter",
        "method": "method",
        "test method": "method",
        "specification": "specification",
        "limit": "specification",
        "acceptance criteria": "specification",
        "result": "result",
        "results": "result",
        "actual": "result",
        "observed value": "result",
        "unit": "unit",
        "uom": "unit",
        "status": "status",
        "pass/fail": "status",
        "conclusion": "status",
    }
    for k, v in builtin.items():
        out.setdefault(k, v)
    return out


_HEADER_LOOKUP = _build_header_lookup(_TABLE_HEADER_ALIASES_JSON)


def _build_label_regex(label_lookup: dict[str, list[str]]) -> re.Pattern[str]:
    """Compile a single regex matching any known label followed by ':'.

    Longest labels first so 'batch number' wins over 'batch'. Word boundaries
    keep us from matching inside arbitrary words.
    """
    keys = sorted(label_lookup.keys(), key=len, reverse=True)
    parts: list[str] = []
    for k in keys:
        words = k.split()
        # Allow flexible whitespace between words (DI sometimes adds runs).
        parts.append(r"\b" + r"\s+".join(re.escape(w) for w in words) + r"\b")
    if not parts:
        # Match nothing.
        return re.compile(r"(?!x)x")
    pattern = r"(?:" + "|".join(parts) + r")\s*:"
    return re.compile(pattern, re.IGNORECASE)


_COA_LABEL_REGEX = _build_label_regex(_COA_LABEL_LOOKUP)
_LABEL_LABEL_REGEX = _build_label_regex(_LABEL_LABEL_LOOKUP)


# ---------- Generic value cleanup --------------------------------------------


_URL_RE = re.compile(
    r"\b(?:https?://|www\.|localhost(?::\d+)?(?:/\S*)?|127\.0\.0\.1(?::\d+)?(?:/\S*)?)\S*",
    re.IGNORECASE,
)
_PAGE_MARKER_FULL_RES = (
    re.compile(r"^\s*\d+\s*/\s*\d+\s*$"),
    re.compile(r"^\s*page\s+\d+(?:\s+of\s+\d+)?\s*$", re.IGNORECASE),
)
_PAGE_MARKER_TRAILING_RES = (
    re.compile(r"\s+\d+\s*/\s*\d+\s*$"),
    re.compile(r"\s+page\s+\d+(?:\s+of\s+\d+)?\s*$", re.IGNORECASE),
)
_TRAILING_PUNCT = " \t\r\n.,;:!|—–_"


def _is_pure_page_marker(line: str) -> bool:
    s = (line or "").strip()
    return any(p.match(s) for p in _PAGE_MARKER_FULL_RES)


def clean_extracted_value(value: Any, field_name: Optional[str] = None) -> Optional[str]:
    """Generic cleanup applied to every extracted field value.

    Steps (all idempotent and safe on None):
      1. NFKC normalize Unicode (collapses width/compat forms).
      2. Strip 'Â' mojibake artifact (UTF-8 read as Latin-1).
      3. Remove URLs (http://, https://, www., localhost, 127.0.0.1).
      4. Remove trailing page markers like '1/1' or 'Page 1 of 1'.
      5. Collapse whitespace.
      6. Trim trailing punctuation/whitespace.

    Returns None when the cleaned value is empty so we never store fake strings.
    """
    if value is None:
        return None
    text = unicodedata.normalize("NFKC", str(value))
    if not text.strip():
        return None
    text = text.replace("Â", "")
    text = _URL_RE.sub(" ", text)
    # Remove trailing page markers — iterate to handle stacked markers.
    for _ in range(3):
        new_text = text
        for p in _PAGE_MARKER_TRAILING_RES:
            new_text = p.sub("", new_text)
        if new_text == text:
            break
        text = new_text
    text = re.sub(r"\s+", " ", text).strip()
    text = text.rstrip(_TRAILING_PUNCT).strip()
    return text or None


# ---------- Field-specific safe extractors -----------------------------------


_ISO_DATE_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
_QTY_UNITS = ("kg", "g", "mg", "l", "ml", "pcs", "units", "unit")
_QTY_RE = re.compile(
    r"(?P<num>\d+(?:[.,]\d+)?)\s*(?P<unit>" + "|".join(_QTY_UNITS) + r")\b",
    re.IGNORECASE,
)


def _extract_first_iso_date(value: Any) -> Optional[str]:
    if not value:
        return None
    m = _ISO_DATE_RE.search(str(value))
    return m.group(0) if m else None


def _extract_first_quantity(value: Any) -> Optional[str]:
    if not value:
        return None
    m = _QTY_RE.search(str(value))
    if not m:
        return None
    unit = m.group("unit").lower()
    return f"{m.group('num')} {unit}"


_STORAGE_C_PATTERNS = (
    (re.compile(r"℃"), " C"),
    (re.compile(r"°\s*C", re.IGNORECASE), " C"),
    (re.compile(r"Â°\s*C", re.IGNORECASE), " C"),
    (re.compile(r"\bdegrees?\s*C\b", re.IGNORECASE), " C"),
    (re.compile(r"\bdeg\s*C\b", re.IGNORECASE), " C"),
    (re.compile(r"\bcelsius\b", re.IGNORECASE), " C"),
)

# A storage phrase is a verb plus (optionally) qualifiers, ending at the
# temperature. Stays generic across "Keep dry, below 25 C", "Store below
# 30 C", "Store at 2-8 C", "Maintain at 25 C".
_STORAGE_PHRASE_RE = re.compile(
    r"\b(?:store|stored|keep|kept|maintain|maintained|protect|protected)"
    r"[^.\n]*?\d+(?:\s*[-–]\s*\d+)?\s*C\b",
    re.IGNORECASE,
)
# Fallback: from the start of the input up to the first temperature mention.
_TEMP_TAIL_RE = re.compile(r".*?\d+(?:\s*[-–]\s*\d+)?\s*C\b")


def normalize_storage_condition(value: Any) -> Optional[str]:
    """Replace Celsius variants with a stable ' C' form (legacy export)."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    for pattern, repl in _STORAGE_C_PATTERNS:
        text = pattern.sub(repl, text)
    text = re.sub(r"(?<=\d)\s*C\b", " C", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def _process_storage_condition(value: Any) -> Optional[str]:
    """Pipeline: generic cleanup -> Celsius normalize -> phrase extraction."""
    cleaned = clean_extracted_value(value, "storage_condition")
    if cleaned is None:
        return None
    normalized = normalize_storage_condition(cleaned) or cleaned
    if not normalized:
        return None
    m = _STORAGE_PHRASE_RE.search(normalized)
    if m:
        phrase = re.sub(r"\s+", " ", m.group(0)).strip()
        return phrase
    m2 = _TEMP_TAIL_RE.match(normalized)
    if m2:
        phrase = re.sub(r"\s+", " ", m2.group(0)).strip()
        # Only return the prefix-up-to-temperature if it's clearly shorter than
        # the input (i.e. we successfully bounded the value).
        if len(phrase) < len(normalized):
            return phrase
    return normalized


# ---------- Main key-value walker --------------------------------------------


def _strip_segment_edges(text: str) -> str:
    """Trim whitespace and connecting punctuation from a value segment."""
    return text.strip(" \t\r\n-—–_|")


def _parse_kv_lines(
    content: str,
    label_lookup: dict[str, list[str]],
    label_regex: re.Pattern[str],
) -> dict[str, str]:
    """Walk lines, find every known label inline, and capture values cleanly.

    For each line, the parser locates ALL occurrences of any known label.
    The text BEFORE the first match continues the previous field's value
    (handles wrapped values). The text BETWEEN two matches is the previous
    label's value. The text AFTER the last match continues into the buffer
    of the new label (will absorb subsequent value-only lines too).

    Section headings flush the in-progress value without starting a new one.
    """
    fields: dict[str, str] = {}
    if not content:
        return fields

    current_targets: list[str] = []
    buffer: list[str] = []

    def flush() -> None:
        if not current_targets:
            return
        value = " ".join(p for p in buffer if p).strip()
        if not value:
            return
        for target in current_targets:
            fields.setdefault(target, value)

    for raw in content.splitlines():
        line = raw.strip()
        if not line:
            continue
        # Drop bare page markers entirely.
        if _is_pure_page_marker(line):
            continue
        # Drop bare URL lines (defense-in-depth; cleanup also handles them).
        line_no_url = _URL_RE.sub("", line).strip()
        if not line_no_url:
            continue

        # Whole-line section heading: flush and reset.
        if _normalize_label(line) in _SECTION_HEADINGS:
            flush()
            current_targets = []
            buffer = []
            continue

        matches = list(label_regex.finditer(line))
        if not matches:
            if current_targets:
                buffer.append(line)
            continue

        prev_end = 0
        for m in matches:
            text_before = _strip_segment_edges(line[prev_end:m.start()])
            if text_before:
                # If the segment is itself a section heading, treat as a flush
                # rather than appending to the in-progress buffer.
                if _normalize_label(text_before) in _SECTION_HEADINGS:
                    flush()
                    current_targets = []
                    buffer = []
                else:
                    if current_targets:
                        buffer.append(text_before)

            flush()
            label_text = m.group(0).rstrip(":").strip()
            label_key = _normalize_label(label_text)
            current_targets = list(label_lookup.get(label_key, []))
            buffer = []
            prev_end = m.end()

        trailing = _strip_segment_edges(line[prev_end:])
        if trailing and current_targets:
            buffer.append(trailing)

    flush()
    return fields


def _extract_test_results(tables: list[dict]) -> list[dict]:
    """Pick the first table whose header row has parameter+result columns."""
    for table in tables or []:
        cells = table.get("cells") or []
        if not cells:
            continue

        by_row: dict[int, dict[int, str]] = {}
        for c in cells:
            r = int(c.get("row_index", 0) or 0)
            col = int(c.get("column_index", 0) or 0)
            txt = str(c.get("content", "") or "").strip()
            by_row.setdefault(r, {})[col] = txt
        if not by_row:
            continue

        header_row = by_row.get(0) or {}
        col_to_canonical: dict[int, str] = {}
        for col_idx, header_text in header_row.items():
            canonical = _HEADER_LOOKUP.get(_normalize_label(header_text))
            if canonical:
                col_to_canonical[col_idx] = canonical

        canonical_set = set(col_to_canonical.values())
        if "parameter" not in canonical_set or "result" not in canonical_set:
            continue

        results: list[dict] = []
        for r in sorted(k for k in by_row.keys() if k != 0):
            row_cells = by_row[r]
            if not any((v or "").strip() for v in row_cells.values()):
                continue
            row: dict[str, Any] = {
                "parameter": None,
                "method": None,
                "specification": None,
                "result": None,
                "unit": None,
                "status": None,
            }
            for col_idx, canonical in col_to_canonical.items():
                value = (row_cells.get(col_idx, "") or "").strip()
                row[canonical] = value or None
            if not row.get("parameter"):
                continue
            results.append(row)
        return results
    return []


def _table_has_analysis_headers(table: dict) -> bool:
    """Return True when a table looks like the results-of-analysis table."""
    cells = table.get("cells") or []
    headers = {
        _HEADER_LOOKUP.get(_normalize_label(c.get("content", "")))
        for c in cells
        if int(c.get("row_index", 0) or 0) == 0
    }
    return "parameter" in headers and "result" in headers


def _extract_kv_from_tables(
    tables: list[dict],
    label_lookup: dict[str, list[str]],
) -> dict[str, str]:
    """Extract key-value fields from layout tables.

    Azure DI may represent the COA metadata block as a table, which preserves
    columns better than the linear content stream. This also handles wrapped
    values in the same value column:

        Supplier:     PT Global
                      Chemical Trading

    The second row has a blank label cell and a non-empty value cell, so it is
    appended to the previous field for that value column.
    """
    fields: dict[str, str] = {}

    for table in tables or []:
        if _table_has_analysis_headers(table):
            continue

        by_row: dict[int, dict[int, str]] = {}
        for cell in table.get("cells") or []:
            row = int(cell.get("row_index", 0) or 0)
            col = int(cell.get("column_index", 0) or 0)
            text = str(cell.get("content", "") or "").strip()
            by_row.setdefault(row, {})[col] = text

        active_by_value_col: dict[int, list[str]] = {}

        for row_idx in sorted(by_row):
            row = by_row[row_idx]
            consumed_cols: set[int] = set()

            for col_idx in sorted(row):
                raw = row.get(col_idx, "")
                label_key = _normalize_label(raw)
                targets = label_lookup.get(label_key)
                if targets is None:
                    continue

                value_col = col_idx + 1
                value = row.get(value_col, "")
                active_by_value_col[value_col] = list(targets)
                consumed_cols.add(col_idx)
                consumed_cols.add(value_col)

                if value and targets:
                    for target in targets:
                        fields[target] = value

            for col_idx in sorted(row):
                if col_idx in consumed_cols:
                    continue
                value = row.get(col_idx, "")
                if not value:
                    continue
                targets = active_by_value_col.get(col_idx)
                if not targets:
                    continue
                for target in targets:
                    previous = fields.get(target, "")
                    fields[target] = f"{previous} {value}".strip() if previous else value

    return fields


def _is_whole_word_prefix(shorter: Any, longer: Any) -> bool:
    s = re.sub(r"\s+", " ", str(shorter or "").strip()).lower()
    l = re.sub(r"\s+", " ", str(longer or "").strip()).lower()
    if not s or not l or s == l or len(s) >= len(l):
        return False
    return l.startswith(s + " ")


def _merge_prefer_structured(base_fields: dict[str, str], table_fields: dict[str, str]) -> dict[str, str]:
    """Merge table-derived fields without blindly overwriting content fields.

    The linear content parser is broad and works when DI does not detect tables.
    The table parser is more reliable for form-like metadata blocks, especially
    wrapped values. Prefer the table value only when it fills a blank, completes
    a clear prefix, or is exactly the same value.
    """
    merged = dict(base_fields)
    for key, table_value in table_fields.items():
        if not table_value:
            continue
        current = merged.get(key)
        if not current:
            merged[key] = table_value
            continue
        if _normalize_for_compare(current) == _normalize_for_compare(table_value):
            merged[key] = table_value
            continue
        if _is_whole_word_prefix(current, table_value):
            merged[key] = table_value
    return merged


def _normalize_for_compare(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).lower()


# ---------- Public API -------------------------------------------------------


def _empty_coa() -> dict:
    coa: dict[str, Any] = {k: None for k in _COA_FIELD_ORDER}
    coa["test_results"] = []
    return coa


def _empty_label() -> dict:
    return {k: None for k in _LABEL_FIELD_ORDER}


def _apply_field_cleanup(record: dict, *, with_storage: bool = True) -> None:
    """Run generic + field-specific cleanup on every captured value in `record`.

    Mutates `record` in place. Leaves None values alone. test_results is
    untouched (it is shaped by the table extractor).
    """
    for field, value in list(record.items()):
        if field == "test_results":
            continue
        if value is None:
            continue
        if field in _DATE_FIELDS:
            cleaned = clean_extracted_value(value, field)
            iso = _extract_first_iso_date(cleaned)
            record[field] = iso if iso else cleaned
            continue
        if field == "quantity":
            cleaned = clean_extracted_value(value, field)
            qty = _extract_first_quantity(cleaned)
            record[field] = qty if qty else cleaned
            continue
        if field == "storage_condition" and with_storage:
            record[field] = _process_storage_condition(value)
            continue
        record[field] = clean_extracted_value(value, field)


def parse_coa(di_result: dict) -> dict:
    """Convert a normalized DI result for a COA into canonical COA fields."""
    coa = _empty_coa()
    if not di_result:
        return coa

    content = di_result.get("content") or ""
    tables = di_result.get("tables") or []

    content_fields = _parse_kv_lines(content, _COA_LABEL_LOOKUP, _COA_LABEL_REGEX)
    table_fields = _extract_kv_from_tables(tables, _COA_LABEL_LOOKUP)
    fields = _merge_prefer_structured(content_fields, table_fields)
    for canonical in _COA_FIELD_ORDER:
        if canonical == "test_results":
            continue
        if canonical in fields:
            coa[canonical] = fields[canonical]

    _apply_field_cleanup(coa)
    coa["test_results"] = _extract_test_results(tables)
    return coa


def parse_label(di_result: dict) -> dict:
    """Convert a normalized DI result for a material label into canonical label fields."""
    label = _empty_label()
    if not di_result:
        return label

    content = di_result.get("content") or ""
    content_fields = _parse_kv_lines(content, _LABEL_LABEL_LOOKUP, _LABEL_LABEL_REGEX)
    table_fields = _extract_kv_from_tables(di_result.get("tables") or [], _LABEL_LABEL_LOOKUP)
    fields = _merge_prefer_structured(content_fields, table_fields)
    for canonical in _LABEL_FIELD_ORDER:
        if canonical in fields:
            label[canonical] = fields[canonical]

    _apply_field_cleanup(label)
    return label
