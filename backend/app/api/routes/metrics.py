"""
Metrics reporting API.

These endpoints read committed data from the database and expose
business metrics to the React frontend.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.metrics_service import (
    build_advisor_list,
    build_leaderboard,
    build_nps_voc,
    build_overview,
    build_product_metrics,
)


router = APIRouter(
    prefix="/api/metrics",
    tags=["Metrics"],
)


@router.get("/overview")
def overview(
    year: int = Query(
        default=2026,
        ge=2000,
        le=2100,
    ),
    month: int = Query(
        default=6,
        ge=1,
        le=12,
    ),
    branch: str | None = Query(
        default=None,
    ),
    grade: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
):
    """
    Company/branch overview for the selected month.
    """

    return build_overview(
        db=db,
        period_year=year,
        period_month=month,
        branch=branch,
        grade=grade,
    )


@router.get("/advisors")
def advisors(
    year: int = Query(
        default=2026,
        ge=2000,
        le=2100,
    ),
    month: int = Query(
        default=6,
        ge=1,
        le=12,
    ),
    branch: str | None = Query(
        default=None,
    ),
    grade: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
):
    """
    Advisor-level metrics for the selected month.
    """

    return {
        "period": {
            "year": year,
            "month": month,
        },
        "data": build_advisor_list(
            db=db,
            period_year=year,
            period_month=month,
            branch=branch,
            grade=grade,
        ),
    }


@router.get("/leaderboard")
def leaderboard(
    year: int = Query(
        default=2026,
        ge=2000,
        le=2100,
    ),
    month: int = Query(
        default=6,
        ge=1,
        le=12,
    ),
    branch: str | None = Query(
        default=None,
    ),
    grade: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
):
    """
    Advisor leaderboard.

    Default ranking metric:
        PM Conversion %
    """

    return {
        "period": {
            "year": year,
            "month": month,
        },
        "ranking_metric": "pm_conversion_pct",
        "data": build_leaderboard(
            db=db,
            period_year=year,
            period_month=month,
            branch=branch,
            grade=grade,
        ),
    }


@router.get("/products")
def products(
    year: int = Query(
        default=2026,
        ge=2000,
        le=2100,
    ),
    month: int = Query(
        default=6,
        ge=1,
        le=12,
    ),
    branch: str | None = Query(
        default=None,
    ),
    grade: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
):
    """
    Product penetration and revenue metrics.
    """

    return build_product_metrics(
        db=db,
        period_year=year,
        period_month=month,
        branch=branch,
        grade=grade,
    )


@router.get("/nps-voc")
def nps_voc(
    year: int = Query(
        default=2026,
        ge=2000,
        le=2100,
    ),
    month: int = Query(
        default=6,
        ge=1,
        le=12,
    ),
    branch: str | None = Query(
        default=None,
    ),
    grade: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
):
    """
    NPS and VOC metrics.

    IVOC is returned as a response-volume metric.
    """

    return build_nps_voc(
        db=db,
        period_year=year,
        period_month=month,
        branch=branch,
        grade=grade,
    )
