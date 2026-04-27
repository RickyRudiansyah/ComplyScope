from fastapi import APIRouter

from backend.config import settings
from backend.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="veritrace-lite",
        doc_intel_configured=settings.doc_intel_configured,
        azure_openai_configured=settings.azure_openai_configured,
    )
