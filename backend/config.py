from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


class Settings(BaseModel):
    app_env: str = os.getenv("APP_ENV", "development")
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    database_path: str = os.getenv("DATABASE_PATH", "backend/storage/veritrace.db")
    use_azure_doc_intel: bool = os.getenv("USE_AZURE_DOC_INTEL", "true").lower() == "true"
    use_azure_openai: bool = os.getenv("USE_AZURE_OPENAI", "true").lower() == "true"
    use_demo_fallback: bool = os.getenv("USE_DEMO_FALLBACK", "true").lower() == "true"


settings = Settings()
