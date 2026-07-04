from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from contextlib import asynccontextmanager
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.ws.listener import start_listener, stop_listener

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Application is starting up...")
    start_listener()
    yield
    # Shutdown
    print("Application is shutting down...")
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

@app.get("/health", tags=["health"])
async def health_check():
    health = {
        "status": "ok",
        "version": settings.VERSION,
        "database": "down"
    }
    
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        health["database"] = "up"
    except Exception as e:
        health["database_error"] = str(e)
        
    return health
