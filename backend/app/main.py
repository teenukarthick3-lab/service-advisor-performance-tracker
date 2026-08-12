"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.upload import router as upload_router
from app.api.routes.metrics import router as metrics_router

from app.core.config import get_settings
from app.core.database import Base, engine

# Import all ORM models so SQLAlchemy registers their tables
# with Base.metadata before create_all() runs.
from app.models.advisor import Advisor
from app.models.snapshot import AdvisorMetricSnapshot
from app.models.upload import ImportBatch


# ============================================================
# SETTINGS
# ============================================================

settings = get_settings()


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

# Create any missing database tables.
#
# This is important for Render because the production SQLite
# database may start without the application's tables.
#
# Existing tables/data are not deleted by create_all().
Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Service Advisor Performance Tracker API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(
    health_router,
)

app.include_router(
    upload_router,
)

app.include_router(
    metrics_router,
)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Service Advisor Performance Tracker API",
        "status": "running",
    }