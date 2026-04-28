"""Demo scenario loader.

Reads cached extracted COA + label fields from
backend/data/demo_extractions.json. The cache contains ONLY extracted fields;
all findings, scores, and decisions are computed at runtime by the validator
and risk engine.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "demo_extractions.json"


def _load_payload() -> dict:
    with DATA_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def list_scenarios() -> list[dict]:
    payload = _load_payload()
    return [
        {
            "scenario_id": s["scenario_id"],
            "title": s.get("title", s["scenario_id"]),
            "description": s.get("description", ""),
        }
        for s in payload.get("scenarios", [])
    ]


def get_scenario(scenario_id: str) -> Optional[dict]:
    payload = _load_payload()
    for s in payload.get("scenarios", []):
        if s.get("scenario_id") == scenario_id:
            return s
    return None
