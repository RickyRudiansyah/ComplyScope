"""Azure Document Intelligence integration.

Wraps the prebuilt-layout model and returns a normalized, JSON-friendly
shape so the parser does not need to depend on Azure SDK types.

Public surface:
    - DocIntelError                     base error
    - DocIntelNotConfigured             raised when env is missing/disabled
    - DocIntelCallError                 raised when the SDK call fails
    - analyze_document(bytes, content_type) -> dict

The returned dict shape is:
    {
        "content": "...",
        "tables": [
            {
                "row_count": int,
                "column_count": int,
                "cells": [
                    {"row_index": int, "column_index": int, "content": str},
                    ...
                ],
            },
            ...
        ],
        "raw": {"model_id": str, "page_count": int, "table_count": int},
    }
"""
from __future__ import annotations

import logging
from typing import Optional

from backend.config import settings

logger = logging.getLogger(__name__)


class DocIntelError(Exception):
    """Base error for Azure Document Intelligence operations."""


class DocIntelNotConfigured(DocIntelError):
    """Raised when Azure DI env vars are missing or USE_AZURE_DOC_INTEL is false."""


class DocIntelCallError(DocIntelError):
    """Raised when the Azure DI SDK call itself fails."""


def _detect_content_type(filename: Optional[str], fallback: str = "application/pdf") -> str:
    if not filename:
        return fallback
    name = filename.lower()
    if name.endswith(".pdf"):
        return "application/pdf"
    if name.endswith(".png"):
        return "image/png"
    if name.endswith(".jpg") or name.endswith(".jpeg"):
        return "image/jpeg"
    if name.endswith(".tif") or name.endswith(".tiff"):
        return "image/tiff"
    return fallback


def _build_client():
    """Construct the Azure DI client. Imports are local so the module loads
    cleanly even when the SDK is not installed in non-DI environments."""
    if not settings.doc_intel_configured:
        raise DocIntelNotConfigured(
            "Azure Document Intelligence is not configured. "
            "Set USE_AZURE_DOC_INTEL=true and provide AZURE_DOC_INTEL_ENDPOINT "
            "and AZURE_DOC_INTEL_KEY."
        )
    try:
        from azure.ai.documentintelligence import DocumentIntelligenceClient
        from azure.core.credentials import AzureKeyCredential
    except ImportError as exc:
        raise DocIntelNotConfigured(
            "azure-ai-documentintelligence is not installed. "
            "Run: pip install azure-ai-documentintelligence azure-core"
        ) from exc
    return DocumentIntelligenceClient(
        endpoint=settings.azure_doc_intel_endpoint,
        credential=AzureKeyCredential(settings.azure_doc_intel_key),
    )


def _normalize_result(result) -> dict:
    content = getattr(result, "content", "") or ""

    tables_out: list[dict] = []
    for t in getattr(result, "tables", None) or []:
        cells_out: list[dict] = []
        for c in getattr(t, "cells", None) or []:
            text = (getattr(c, "content", "") or "").replace("\n", " ").strip()
            cells_out.append(
                {
                    "row_index": int(getattr(c, "row_index", 0) or 0),
                    "column_index": int(getattr(c, "column_index", 0) or 0),
                    "content": text,
                }
            )
        tables_out.append(
            {
                "row_count": int(getattr(t, "row_count", 0) or 0),
                "column_count": int(getattr(t, "column_count", 0) or 0),
                "cells": cells_out,
            }
        )

    raw = {
        "model_id": settings.azure_doc_intel_model_id,
        "page_count": len(getattr(result, "pages", None) or []),
        "table_count": len(getattr(result, "tables", None) or []),
    }
    return {"content": content, "tables": tables_out, "raw": raw}


def analyze_document(
    file_bytes: bytes,
    *,
    filename: Optional[str] = None,
    content_type: Optional[str] = None,
) -> dict:
    """Send `file_bytes` to Azure DI prebuilt-layout and return the normalized result.

    Raises:
        DocIntelNotConfigured: if env is incomplete or SDK is missing.
        DocIntelCallError: if the SDK call fails or returns no data.
    """
    if not file_bytes:
        raise DocIntelCallError("Empty file provided to Azure Document Intelligence.")

    ct = content_type or _detect_content_type(filename)
    model_id = settings.azure_doc_intel_model_id or "prebuilt-layout"

    client = _build_client()
    try:
        poller = client.begin_analyze_document(
            model_id=model_id,
            body=file_bytes,
            content_type=ct,
        )
        result = poller.result()
    except DocIntelError:
        raise
    except Exception as exc:  # SDK exceptions vary; map them all to a controlled error
        # Do not expose the key/endpoint in messages.
        logger.warning(
            "Azure Document Intelligence call failed (%s)", type(exc).__name__
        )
        raise DocIntelCallError(
            f"Azure Document Intelligence call failed: {type(exc).__name__}"
        ) from exc

    return _normalize_result(result)
