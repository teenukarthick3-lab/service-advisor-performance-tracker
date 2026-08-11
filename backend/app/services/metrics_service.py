"""
Metrics calculation service.

This module contains business calculations used by the reporting APIs.

Important:
- Snapshot rows are NEVER summed together just because they are daily.
- For a period/month, the latest available snapshot is used.
- PM Conversion is calculated from PM / GUS.
- NPS is calculated from Promoters, Detractors and Sample.
- Currency values are aggregated from the selected snapshots.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.snapshot import AdvisorMetricSnapshot


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def safe_percentage(
    numerator: float,
    denominator: float,
) -> float:
    """Return numerator / denominator * 100 safely."""

    if denominator is None or denominator <= 0:
        return 0.0

    return round((numerator / denominator) * 100, 2)


def calculate_pm_conversion(
    pm: int | float,
    gus: int | float,
) -> float:
    """PM Conversion % = PM / GUS * 100."""

    return safe_percentage(pm, gus)


def calculate_nps(
    promoters: int,
    detractors: int,
    sample: int,
) -> float:
    """
    NPS = (Promoters - Detractors) / Sample * 100.
    """

    if sample is None or sample <= 0:
        return 0.0

    return round(
        ((promoters - detractors) / sample) * 100,
        2,
    )


# ---------------------------------------------------------------------------
# Snapshot selection
# ---------------------------------------------------------------------------


def latest_snapshots_for_period(
    db: Session,
    period_year: int,
    period_month: int,
    branch: str | None = None,
    grade: str | None = None,
) -> list[AdvisorMetricSnapshot]:
    """
    Return the latest snapshot for every advisor for a given
    calendar month.

    This is the key rule for daily-uploaded data.

    Example:

        Aug 08 snapshot
        Aug 09 snapshot
        Aug 10 snapshot

    We use Aug 10 for the current month's advisor state.

    We do NOT sum Aug 08 + Aug 09 + Aug 10.
    """

    latest_date_subquery = (
        db.query(
            AdvisorMetricSnapshot.advisor_id,
            func.max(
                AdvisorMetricSnapshot.snapshot_date
            ).label("latest_date"),
        )
        .filter(
            AdvisorMetricSnapshot.period_year == period_year,
            AdvisorMetricSnapshot.period_month == period_month,
        )
        .group_by(
            AdvisorMetricSnapshot.advisor_id,
        )
        .subquery()
    )

    query = (
        db.query(AdvisorMetricSnapshot)
        .join(
            latest_date_subquery,
            (
                AdvisorMetricSnapshot.advisor_id
                == latest_date_subquery.c.advisor_id
            )
            & (
                AdvisorMetricSnapshot.snapshot_date
                == latest_date_subquery.c.latest_date
            ),
        )
        .filter(
            AdvisorMetricSnapshot.period_year == period_year,
            AdvisorMetricSnapshot.period_month == period_month,
        )
    )

    if branch:
        query = query.filter(
            AdvisorMetricSnapshot.branch == branch
        )

    if grade:
        query = query.filter(
            AdvisorMetricSnapshot.grade == grade
        )

    return query.all()


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------


def build_overview(
    db: Session,
    period_year: int,
    period_month: int,
    branch: str | None = None,
    grade: str | None = None,
) -> dict[str, Any]:
    """
    Build company/branch overview metrics for a month.
    """

    snapshots = latest_snapshots_for_period(
        db=db,
        period_year=period_year,
        period_month=period_month,
        branch=branch,
        grade=grade,
    )

    total_gus = sum(
        snapshot.gus or 0
        for snapshot in snapshots
    )

    total_pm = sum(
        snapshot.pm or 0
        for snapshot in snapshots
    )

    total_vas_revenue = sum(
        float(snapshot.vas_value or 0)
        for snapshot in snapshots
    )

    total_sample = sum(
        snapshot.nps_sample or 0
        for snapshot in snapshots
    )

    total_promoters = sum(
        snapshot.nps_promoters or 0
        for snapshot in snapshots
    )

    total_detractors = sum(
        snapshot.nps_detractors or 0
        for snapshot in snapshots
    )

    total_neutral = sum(
        snapshot.nps_neutral or 0
        for snapshot in snapshots
    )

    total_ivoc = sum(
        snapshot.ivoc_responses or 0
        for snapshot in snapshots
    )

    pm_conversion_pct = calculate_pm_conversion(
        total_pm,
        total_gus,
    )

    nps = calculate_nps(
        total_promoters,
        total_detractors,
        total_sample,
    )

    return {
        "period": {
            "year": period_year,
            "month": period_month,
        },
        "filters": {
            "branch": branch,
            "grade": grade,
        },
        "active_advisors": len(snapshots),
        "total_gus": total_gus,
        "total_pm": total_pm,
        "pm_conversion_pct": pm_conversion_pct,
        "total_vas_revenue": round(
            total_vas_revenue,
            2,
        ),
        "nps": nps,
        "nps_sample": total_sample,
        "nps_promoters": total_promoters,
        "nps_neutral": total_neutral,
        "nps_detractors": total_detractors,
        "ivoc_responses": total_ivoc,
    }


# ---------------------------------------------------------------------------
# Advisor list
# ---------------------------------------------------------------------------


def build_advisor_list(
    db: Session,
    period_year: int,
    period_month: int,
    branch: str | None = None,
    grade: str | None = None,
) -> list[dict[str, Any]]:
    """
    Return advisor-level metrics for the selected month.

    Includes:
    - Basic advisor information
    - GUS / PM
    - PM Conversion
    - NPS
    - VAS
    - IVOC
    - Product counts
    """

    snapshots = latest_snapshots_for_period(
        db=db,
        period_year=period_year,
        period_month=period_month,
        branch=branch,
        grade=grade,
    )

    results: list[dict[str, Any]] = []

    for snapshot in snapshots:

        pm_conversion_pct = calculate_pm_conversion(
            snapshot.pm or 0,
            snapshot.gus or 0,
        )

        nps = calculate_nps(
            snapshot.nps_promoters or 0,
            snapshot.nps_detractors or 0,
            snapshot.nps_sample or 0,
        )

        results.append(
            {
                # ----------------------------------------------------------
                # Advisor information
                # ----------------------------------------------------------
                "advisor_id": snapshot.advisor_id,
                "name": snapshot.advisor.display_name,
                "employee_number": snapshot.advisor.employee_number,
                "branch": snapshot.branch,
                "city": snapshot.city,
                "designation": snapshot.designation,
                "grade": snapshot.grade,
                "snapshot_date": snapshot.snapshot_date.isoformat(),

                # ----------------------------------------------------------
                # Core performance metrics
                # ----------------------------------------------------------
                "gus": snapshot.gus or 0,
                "pm": snapshot.pm or 0,
                "pm_conversion_pct": pm_conversion_pct,

                # ----------------------------------------------------------
                # NPS
                # ----------------------------------------------------------
                "nps": nps,
                "nps_sample": snapshot.nps_sample or 0,

                # ----------------------------------------------------------
                # Revenue / VOC
                # ----------------------------------------------------------
                "vas_value": float(
                    snapshot.vas_value or 0
                ),
                "ivoc_responses": snapshot.ivoc_responses or 0,

                # ----------------------------------------------------------
                # Product performance
                #
                # These values already exist in the database and are
                # already used by build_product_metrics().
                #
                # We are exposing them here so the Advisor Detail page
                # can display advisor-level product performance.
                # ----------------------------------------------------------
                "tyre": snapshot.tyre or 0,
                "battery": snapshot.battery or 0,
                "injector_cleaner": snapshot.injector_cleaner or 0,
                "engine_flush": snapshot.engine_flush or 0,
                "bactakleen": snapshot.bactakleen or 0,
                "wheel_alignment": snapshot.wheel_alignment or 0,
                "smiles_amc": snapshot.smiles_amc or 0,
                                "tyre_pm_conversion_pct": float(
                    snapshot.tyre_pm_conversion_pct or 0
                ),
                "battery_pm_conversion_pct": float(
                    snapshot.battery_pm_conversion_pct or 0
                ),
                "injector_cleaner_pm_conversion_pct": float(
                    snapshot.injector_cleaner_pm_conversion_pct or 0
                ),
                "engine_flush_pm_conversion_pct": float(
                    snapshot.engine_flush_pm_conversion_pct or 0
                ),
                "bactakleen_pm_conversion_pct": float(
                    snapshot.bactakleen_pm_conversion_pct or 0
                ),
                "wheel_alignment_pm_conversion_pct": float(
                    snapshot.wheel_alignment_pm_conversion_pct or 0
                ),
                "smiles_amc_pm_conversion_pct": float(
                    snapshot.smiles_amc_pm_conversion_pct or 0
                ),
            }
        )

    return results


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------


def build_leaderboard(
    db: Session,
    period_year: int,
    period_month: int,
    branch: str | None = None,
    grade: str | None = None,
) -> list[dict[str, Any]]:
    """
    Build leaderboard using PM Conversion % as the initial
    configurable ranking metric.

    The ranking rule is intentionally isolated here so it can
    be changed later without redesigning the database.
    """

    advisors = build_advisor_list(
        db=db,
        period_year=period_year,
        period_month=period_month,
        branch=branch,
        grade=grade,
    )

    advisors.sort(
        key=lambda item: item["pm_conversion_pct"],
        reverse=True,
    )

    for rank, advisor in enumerate(
        advisors,
        start=1,
    ):
        advisor["rank"] = rank

    return advisors


# ---------------------------------------------------------------------------
# Product metrics
# ---------------------------------------------------------------------------


def build_product_metrics(
    db: Session,
    period_year: int,
    period_month: int,
    branch: str | None = None,
    grade: str | None = None,
) -> dict[str, Any]:
    """
    Build product counts and penetration rates.

    Every penetration rate uses GUS as denominator.
    """

    snapshots = latest_snapshots_for_period(
        db=db,
        period_year=period_year,
        period_month=period_month,
        branch=branch,
        grade=grade,
    )

    gus = sum(
        snapshot.gus or 0
        for snapshot in snapshots
    )

    products = {
        "tyre": sum(
            snapshot.tyre or 0
            for snapshot in snapshots
        ),
        "battery": sum(
            snapshot.battery or 0
            for snapshot in snapshots
        ),
        "injector_cleaner": sum(
            snapshot.injector_cleaner or 0
            for snapshot in snapshots
        ),
        "engine_flush": sum(
            snapshot.engine_flush or 0
            for snapshot in snapshots
        ),
        "bactakleen": sum(
            snapshot.bactakleen or 0
            for snapshot in snapshots
        ),
        "wheel_alignment": sum(
            snapshot.wheel_alignment or 0
            for snapshot in snapshots
        ),
        "smiles_amc": sum(
            snapshot.smiles_amc or 0
            for snapshot in snapshots
        ),
    }

    product_results = {}

    for name, count in products.items():
        product_results[name] = {
            "count": count,
            "penetration_pct": safe_percentage(
                count,
                gus,
            ),
        }

    total_vas = sum(
        float(snapshot.vas_value or 0)
        for snapshot in snapshots
    )

    total_diy = sum(
        float(snapshot.diy_value or 0)
        for snapshot in snapshots
    )

    total_accessories = sum(
        float(snapshot.accessories_value or 0)
        for snapshot in snapshots
    )

    return {
        "period": {
            "year": period_year,
            "month": period_month,
        },
        "gus": gus,
        "products": product_results,
        "revenue": {
            "vas_value": round(total_vas, 2),
            "diy_value": round(total_diy, 2),
            "accessories_value": round(
                total_accessories,
                2,
            ),
        },
    }


# ---------------------------------------------------------------------------
# NPS / VOC
# ---------------------------------------------------------------------------


def build_nps_voc(
    db: Session,
    period_year: int,
    period_month: int,
    branch: str | None = None,
    grade: str | None = None,
) -> dict[str, Any]:
    """
    Build NPS and VOC metrics.

    IVOC is treated as a response count.
    TKM VOC remains available but is not presented as a KPI.
    """

    snapshots = latest_snapshots_for_period(
        db=db,
        period_year=period_year,
        period_month=period_month,
        branch=branch,
        grade=grade,
    )

    sample = sum(
        snapshot.nps_sample or 0
        for snapshot in snapshots
    )

    promoters = sum(
        snapshot.nps_promoters or 0
        for snapshot in snapshots
    )

    neutral = sum(
        snapshot.nps_neutral or 0
        for snapshot in snapshots
    )

    detractors = sum(
        snapshot.nps_detractors or 0
        for snapshot in snapshots
    )

    ivoc = sum(
        snapshot.ivoc_responses or 0
        for snapshot in snapshots
    )

    nps = calculate_nps(
        promoters,
        detractors,
        sample,
    )

    return {
        "period": {
            "year": period_year,
            "month": period_month,
        },
        "nps": {
            "score": nps,
            "sample": sample,
            "promoters": promoters,
            "neutral": neutral,
            "detractors": detractors,
        },
        "voc": {
            "ivoc_responses": ivoc,
        },
    }