from app.api.routes.metrics import router as metrics_router
from app.api.routes.upload import router as upload_router
from fastapi import APIRouter

from app.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)

# Future stages will add:
# api_router.include_router(advisors_router, prefix="/advisors")
# api_router.include_router(metrics_router, prefix="/metrics")
# api_router.include_router(upload_router, prefix="/upload")
"""
API route registration.
"""


router = APIRouter()

router.include_router(health_router)
router.include_router(upload_router)
router.include_router(metrics_router)
