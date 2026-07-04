from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from contextlib import asynccontextmanager
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.ws.listener import start_listener, stop_listener
# Import all ORM models so SQLAlchemy registers every mapper
import app.models
from sqlalchemy.orm import configure_mappers
from loguru import logger
configure_mappers()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Application is starting up...")
    start_listener()
    yield
    # Shutdown
    logger.info("Application is shutting down...")
    await stop_listener()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

from datetime import datetime, timezone
from fastapi import Response, status

@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/liveness", tags=["health"])
async def liveness_check():
    return {"status": "alive"}

@app.get("/readiness", tags=["health"])
async def readiness_check(response: Response):
    readiness = {
        "status": "ready",
        "database": "down"
    }
    
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        readiness["database"] = "up"
    except Exception as e:
        readiness["status"] = "unavailable"
        readiness["database_error"] = str(e)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        
    return readiness
