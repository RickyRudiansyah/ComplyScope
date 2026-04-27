from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


def _env_bool(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).strip().lower() == "true"


def _resolve_db_path(raw: str) -> str:
    p = Path(raw)
    if not p.is_absolute():
        p = ROOT_DIR / p
    return str(p)


class Settings(BaseModel):
    app_env: str = os.getenv("APP_ENV", "development")
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))

    database_path: str = _resolve_db_path(
        os.getenv("DATABASE_PATH", "backend/storage/veritrace.db")
    )

    use_azure_doc_intel: bool = _env_bool("USE_AZURE_DOC_INTEL", "true")
    use_azure_openai: bool = _env_bool("USE_AZURE_OPENAI", "true")
    use_demo_fallback: bool = _env_bool("USE_DEMO_FALLBACK", "true")

    azure_doc_intel_endpoint: str = os.getenv("AZURE_DOC_INTEL_ENDPOINT", "")
    azure_doc_intel_key: str = os.getenv("AZURE_DOC_INTEL_KEY", "")
    azure_doc_intel_model_id: str = os.getenv("AZURE_DOC_INTEL_MODEL_ID", "prebuilt-layout")

    azure_openai_endpoint: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    azure_openai_key: str = os.getenv("AZURE_OPENAI_KEY", "")
    azure_openai_deployment: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
    azure_openai_api_version: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

    @property
    def doc_intel_configured(self) -> bool:
        return (
            self.use_azure_doc_intel
            and bool(self.azure_doc_intel_endpoint)
            and bool(self.azure_doc_intel_key)
        )

    @property
    def azure_openai_configured(self) -> bool:
        return (
            self.use_azure_openai
            and bool(self.azure_openai_endpoint)
            and bool(self.azure_openai_key)
            and bool(self.azure_openai_deployment)
        )


settings = Settings()
