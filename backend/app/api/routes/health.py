"""
Health check API.

Provides a simple liveness check and verifies that the
application can communicate with the database.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.health import HealthResponse


router = APIRouter(
    prefix="/api",
    tags=["health"],
)


@router.get(
    "/health",
    response_model=HealthResponse,
)
def health_check(
    db: Session = Depends(get_db),
) -> HealthResponse:
    """
    Basic liveness and database-connectivity check.

    Endpoint:
        GET /api/health
    """

    settings = get_settings()

    database_connected = True

    try:
        db.execute(text("SELECT 1"))
    except Exception:
        database_connected = False

    return HealthResponse(
        status="ok" if database_connected else "degraded",
        environment=settings.environment,
        database_connected=database_connected,
    )
