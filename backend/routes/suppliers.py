from typing import List

from fastapi import APIRouter

from backend.database import db_session
from backend.schemas import Supplier

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=List[Supplier])
def list_suppliers() -> List[Supplier]:
    with db_session() as conn:
        rows = conn.execute(
            "SELECT supplier_name, status FROM suppliers ORDER BY supplier_name"
        ).fetchall()
    return [Supplier(supplier_name=r["supplier_name"], status=r["status"]) for r in rows]
