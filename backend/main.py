from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db, is_empty
from backend.routes.health import router as health_router
from backend.routes.materials import router as materials_router
from backend.routes.suppliers import router as suppliers_router
from backend.seed import seed_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if is_empty():
        seed_all()
    yield


app = FastAPI(title="VeriTrace Lite API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(materials_router, prefix="/api")
app.include_router(suppliers_router, prefix="/api")
