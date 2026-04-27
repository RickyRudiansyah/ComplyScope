import json
from typing import List

from fastapi import APIRouter, HTTPException

from backend.database import db_session
from backend.schemas import ApprovedSupplier, MaterialBase, MaterialDetail, MaterialSpec

router = APIRouter(prefix="/materials", tags=["materials"])


def _row_to_material(row) -> MaterialBase:
    return MaterialBase(
        material_code=row["material_code"],
        material_name=row["material_name"],
        category=row["category"],
        min_shelf_life_days=row["min_shelf_life_days"],
        storage_requirement=row["storage_requirement"],
    )


def _row_to_spec(row) -> MaterialSpec:
    aliases: list = []
    raw = row["aliases_json"]
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                aliases = [str(a) for a in parsed]
        except json.JSONDecodeError:
            aliases = []
    return MaterialSpec(
        parameter=row["parameter"],
        method=row["method"],
        spec_type=row["spec_type"],
        spec_min=row["spec_min"],
        spec_max=row["spec_max"],
        expected_text=row["expected_text"],
        unit=row["unit"],
        required=bool(row["required"]),
        criticality=row["criticality"],
        aliases=aliases,
    )


@router.get("", response_model=List[MaterialBase])
def list_materials() -> List[MaterialBase]:
    with db_session() as conn:
        rows = conn.execute(
            "SELECT material_code, material_name, category, min_shelf_life_days, "
            "storage_requirement FROM materials ORDER BY material_code"
        ).fetchall()
    return [_row_to_material(r) for r in rows]


@router.get("/{code}", response_model=MaterialDetail)
def get_material(code: str) -> MaterialDetail:
    with db_session() as conn:
        material = conn.execute(
            "SELECT material_code, material_name, category, min_shelf_life_days, "
            "storage_requirement FROM materials WHERE material_code = ?",
            (code,),
        ).fetchone()
        if material is None:
            raise HTTPException(status_code=404, detail=f"Material '{code}' not found")

        spec_rows = conn.execute(
            "SELECT parameter, method, spec_type, spec_min, spec_max, expected_text, "
            "unit, required, criticality, aliases_json FROM material_specs "
            "WHERE material_code = ? ORDER BY id",
            (code,),
        ).fetchall()

        supplier_rows = conn.execute(
            "SELECT supplier_name, status FROM material_suppliers "
            "WHERE material_code = ? AND status = 'APPROVED' "
            "ORDER BY supplier_name",
            (code,),
        ).fetchall()

    base = _row_to_material(material)
    return MaterialDetail(
        **base.model_dump(),
        specs=[_row_to_spec(r) for r in spec_rows],
        approved_suppliers=[
            ApprovedSupplier(supplier_name=r["supplier_name"], status=r["status"])
            for r in supplier_rows
        ],
    )
