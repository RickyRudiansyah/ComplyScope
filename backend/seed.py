"""Seed the SQLite database from backend/data/*.json.

Idempotent: safe to run multiple times. Uses INSERT OR REPLACE keyed on the
unique columns defined in database.SCHEMA_STATEMENTS.

Run standalone:
    python backend/seed.py
or from the backend directory:
    python seed.py
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_HERE = Path(__file__).resolve().parent
from backend.database import db_session, init_db

DATA_DIR = _HERE / "data"


def _load_json(name: str) -> Any:
    path = DATA_DIR / name
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _seed_materials(conn) -> int:
    payload = _load_json("seed_materials.json")
    rows = payload.get("materials", payload if isinstance(payload, list) else [])
    count = 0
    for m in rows:
        conn.execute(
            """
            INSERT INTO materials
                (material_code, material_name, category, min_shelf_life_days, storage_requirement)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(material_code) DO UPDATE SET
                material_name = excluded.material_name,
                category = excluded.category,
                min_shelf_life_days = excluded.min_shelf_life_days,
                storage_requirement = excluded.storage_requirement
            """,
            (
                m["material_code"],
                m["material_name"],
                m.get("category"),
                m.get("min_shelf_life_days"),
                m.get("storage_requirement"),
            ),
        )
        count += 1
    return count


def _seed_specs(conn) -> int:
    payload = _load_json("seed_specs.json")
    rows = payload.get("specs", payload if isinstance(payload, list) else [])
    count = 0
    for s in rows:
        aliases = s.get("aliases") or []
        conn.execute(
            """
            INSERT INTO material_specs
                (material_code, parameter, method, spec_type, spec_min, spec_max,
                 expected_text, unit, required, criticality, aliases_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(material_code, parameter) DO UPDATE SET
                method = excluded.method,
                spec_type = excluded.spec_type,
                spec_min = excluded.spec_min,
                spec_max = excluded.spec_max,
                expected_text = excluded.expected_text,
                unit = excluded.unit,
                required = excluded.required,
                criticality = excluded.criticality,
                aliases_json = excluded.aliases_json
            """,
            (
                s["material_code"],
                s["parameter"],
                s.get("method"),
                s["spec_type"],
                s.get("spec_min"),
                s.get("spec_max"),
                s.get("expected_text"),
                s.get("unit"),
                1 if s.get("required", True) else 0,
                s.get("criticality"),
                json.dumps(aliases, ensure_ascii=False),
            ),
        )
        count += 1
    return count


def _seed_suppliers(conn) -> tuple[int, int]:
    payload = _load_json("seed_suppliers.json")

    suppliers = payload.get("suppliers", []) if isinstance(payload, dict) else []
    mapping = payload.get("material_suppliers", []) if isinstance(payload, dict) else []

    sup_count = 0
    for s in suppliers:
        conn.execute(
            """
            INSERT INTO suppliers (supplier_name, status)
            VALUES (?, ?)
            ON CONFLICT(supplier_name) DO UPDATE SET
                status = excluded.status
            """,
            (s["supplier_name"], s.get("status", "APPROVED")),
        )
        sup_count += 1

    map_count = 0
    for ms in mapping:
        # Make sure the supplier exists even if it wasn't in the suppliers[] list.
        conn.execute(
            """
            INSERT INTO suppliers (supplier_name, status)
            VALUES (?, ?)
            ON CONFLICT(supplier_name) DO NOTHING
            """,
            (ms["supplier_name"], ms.get("status", "APPROVED")),
        )
        conn.execute(
            """
            INSERT INTO material_suppliers (material_code, supplier_name, status)
            VALUES (?, ?, ?)
            ON CONFLICT(material_code, supplier_name) DO UPDATE SET
                status = excluded.status
            """,
            (ms["material_code"], ms["supplier_name"], ms.get("status", "APPROVED")),
        )
        map_count += 1

    return sup_count, map_count


def seed_all() -> dict:
    init_db()
    with db_session() as conn:
        materials = _seed_materials(conn)
        specs = _seed_specs(conn)
        suppliers, mappings = _seed_suppliers(conn)
    return {
        "materials": materials,
        "material_specs": specs,
        "suppliers": suppliers,
        "material_suppliers": mappings,
    }


if __name__ == "__main__":
    summary = seed_all()
    print("Seed complete:", summary)
