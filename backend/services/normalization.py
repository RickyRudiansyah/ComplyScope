"""Text normalization helpers for parser/validator use.

Pure utilities only. They do NOT enforce any validation rule. Wire them in
when the parser/validator needs tolerant string comparisons (e.g. comparing
storage_condition strings extracted from documents that use different
encodings of the degree-Celsius symbol).
"""
from __future__ import annotations

import re
from typing import Any


# Common mojibake bytes that show up when UTF-8 is mis-decoded as latin-1.
# `Â` in particular precedes `°` (U+00B0 = 0xC2 0xB0 in UTF-8).
_MOJIBAKE_CHARS = ("Â",)  # Â

# Single-character temperature symbols → spaced ASCII letter.
_TEMP_CHAR_REPLACEMENTS = {
    "℃": " c",   # ℃ DEGREE CELSIUS
    "℉": " f",   # ℉ DEGREE FAHRENHEIT
    "°": " ",    # ° DEGREE SIGN (letter following stays)
}

# Multi-letter temperature words. Captures both an attached unit letter
# ("deg c", "degrees c") and standalone words ("celsius", "fahrenheit").
_TEMP_WORD_RE = re.compile(
    r"\b(?:degrees?\s*c|deg\s*c|celsius)\b",
    re.IGNORECASE,
)
_TEMP_WORD_RE_F = re.compile(
    r"\b(?:degrees?\s*f|deg\s*f|fahrenheit)\b",
    re.IGNORECASE,
)

_TRIM_CHARS = " \t\r\n.,;:!?"
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(value: Any) -> str:
    """Lowercase, trim, collapse whitespace, and normalize common
    encoding/temperature variants.

    Examples:
        '25°C', '25 °C', '25℃', '25Â°C', '25 deg C', '25 degrees C',
        '25 celsius', '25 C'  →  '25 c'

    The function is intentionally cosmetic — it does not parse numbers or
    enforce units. It only makes downstream string comparisons tolerant of
    cosmetic differences.
    """
    if value is None:
        return ""

    text = str(value)

    # Strip well-known mojibake bytes first so the temperature replacements
    # below see clean characters.
    for ch in _MOJIBAKE_CHARS:
        if ch in text:
            text = text.replace(ch, "")

    for src, repl in _TEMP_CHAR_REPLACEMENTS.items():
        if src in text:
            text = text.replace(src, repl)

    text = text.lower()

    # Collapse temperature words into a single ASCII unit letter.
    text = _TEMP_WORD_RE.sub(" c", text)
    text = _TEMP_WORD_RE_F.sub(" f", text)

    text = _WHITESPACE_RE.sub(" ", text)
    text = text.strip().strip(_TRIM_CHARS)
    return text
