"""SQLite connection helpers and schema initialization for VeriTrace Lite."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, Optional

from backend.config import settings


SCHEMA_STATEMENTS: list[str] = [
    """
    CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_code TEXT NOT NULL UNIQUE,
        material_name TEXT NOT NULL,
        category TEXT,
        min_shelf_life_days INTEGER,
        storage_requirement TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS material_specs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_code TEXT NOT NULL,
        parameter TEXT NOT NULL,
        method TEXT,
        spec_type TEXT NOT NULL,
        spec_min REAL,
        spec_max REAL,
        expected_text TEXT,
        unit TEXT,
        required INTEGER NOT NULL DEFAULT 1,
        criticality TEXT,
        aliases_json TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (material_code, parameter)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_name TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS material_suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_code TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        status TEXT NOT NULL,
        UNIQUE (material_code, supplier_name)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS verification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT NOT NULL UNIQUE,
        decision TEXT NOT NULL,
        risk_score INTEGER,
        risk_level TEXT,
        material_code TEXT,
        material_name TEXT,
        supplier TEXT,
        extracted_json TEXT,
        findings_json TEXT,
        summary TEXT,
        recommendation TEXT,
        reviewer_note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
]


def get_db_path() -> Path:
    return Path(settings.database_path)


def _ensure_parent_dir() -> None:
    get_db_path().parent.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    _ensure_parent_dir()
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_session() -> Iterator[sqlite3.Connection]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Create all tables if they don't exist."""
    with db_session() as conn:
        for stmt in SCHEMA_STATEMENTS:
            conn.execute(stmt)


def is_empty() -> bool:
    """Return True if the materials table has no rows (treat as fresh DB)."""
    with db_session() as conn:
        row = conn.execute("SELECT COUNT(*) AS c FROM materials").fetchone()
        return int(row["c"]) == 0


def fetch_material(material_code: str) -> Optional[dict]:
    with db_session() as conn:
        row = conn.execute(
            "SELECT material_code, material_name, category, min_shelf_life_days, "
            "storage_requirement FROM materials WHERE material_code = ?",
            (material_code,),
        ).fetchone()
    return dict(row) if row else None


def fetch_approved_suppliers(material_code: str) -> list[str]:
    with db_session() as conn:
        rows = conn.execute(
            "SELECT supplier_name FROM material_suppliers "
            "WHERE material_code = ? AND status = 'APPROVED' "
            "ORDER BY supplier_name",
            (material_code,),
        ).fetchall()
    return [r["supplier_name"] for r in rows]


def fetch_material_specs(material_code: str) -> list[dict]:
    with db_session() as conn:
        rows = conn.execute(
            "SELECT material_code, parameter, method, spec_type, spec_min, spec_max, "
            "expected_text, unit, required, criticality, aliases_json "
            "FROM material_specs WHERE material_code = ? ORDER BY id",
            (material_code,),
        ).fetchall()
    out: list[dict] = []
    for r in rows:
        d = dict(r)
        d["required"] = bool(d.get("required"))
        try:
            d["aliases"] = json.loads(d.get("aliases_json") or "[]")
        except json.JSONDecodeError:
            d["aliases"] = []
        out.append(d)
    return out
