"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.upload import router as upload_router
from app.api.routes.metrics import router as metrics_router
from app.core.config import get_settings


settings = get_settings()


app = FastAPI(
    title="Service Advisor Performance Tracker API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================
#
# React frontend runs on localhost:5173.
# FastAPI backend runs on 127.0.0.1:8000.
#
# The browser treats these as different origins, so the backend
# must explicitly allow the frontend to make API requests.
#
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
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Service Advisor Performance Tracker API",
        "status": "running",
    }
