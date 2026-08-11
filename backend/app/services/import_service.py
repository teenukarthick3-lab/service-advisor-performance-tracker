"""
Database import service.

Takes a validated Excel ingestion result and writes it to SQLite/PostgreSQL
using one transaction.

Important rules:

- Invalid data must never modify committed data.
- Advisors are identified by Employee Number when available.
- If Employee Number is missing, normalized name is used.
- Daily uploads are stored as snapshots.
- Re-uploading the same business date updates the existing snapshot.
- Different business dates create different snapshots.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.advisor import Advisor
from app.models.snapshot import AdvisorMetricSnapshot
from app.models.upload import ImportBatch, ImportStatus
from app.services.excel_ingestion import (
    AdvisorSnapshotPayload,
    IngestionResult,
)


# ---------------------------------------------------------------------------
# Month conversion
# ---------------------------------------------------------------------------

MONTH_MAP = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


def month_to_number(month: str) -> int:
    """
    Convert Excel month name into calendar month number.
    """

    normalized = month.strip().lower()

    if normalized not in MONTH_MAP:
        raise ValueError(
            f"Unsupported month name: {month!r}"
        )

    return MONTH_MAP[normalized]


# ---------------------------------------------------------------------------
# Value conversion helpers
# ---------------------------------------------------------------------------

def _int_value(value: Any) -> int:
    """
    Convert an integer-like Excel/database value to int.

    Empty/None values become 0.
    """

    if value is None:
        return 0

    if value == "":
        return 0

    return int(value)


def _float_value(value: Any) -> float:
    """
    Convert percentage/decimal metrics to float.

    Empty/None values become 0.0.
    """

    if value is None:
        return 0.0

    if value == "":
        return 0.0

    return float(value)


def _nullable_int(value: Any) -> int | None:
    """
    Preserve None for optional integer metrics.
    """

    if value is None:
        return None

    if value == "":
        return None

    return int(value)


def _decimal_value(value: Any) -> float:
    """
    Convert currency/value metrics into a numeric value.

    SQLAlchemy Numeric columns will handle database precision.
    """

    if value is None:
        return 0.0

    if value == "":
        return 0.0

    return float(value)


# ---------------------------------------------------------------------------
# Advisor lookup / creation
# ---------------------------------------------------------------------------

def get_or_create_advisor(
    db: Session,
    payload: AdvisorSnapshotPayload,
) -> tuple[Advisor, bool]:
    """
    Find an existing advisor or create a new one.

    Primary identity:
        Employee Number

    Fallback:
        Normalized Service Advisor Name
    """

    advisor = db.scalar(
        select(Advisor).where(
            Advisor.identity_key == payload.identity_key
        )
    )

    if advisor is not None:
        # Keep the most recently seen display information.
        advisor.display_name = payload.display_name
        advisor.normalized_name = payload.normalized_name

        if payload.employee_number:
            advisor.employee_number = payload.employee_number

        return advisor, False

    advisor = Advisor(
        employee_number=payload.employee_number,
        display_name=payload.display_name,
        normalized_name=payload.normalized_name,
        identity_key=payload.identity_key,
    )

    db.add(advisor)
    db.flush()

    return advisor, True


# ---------------------------------------------------------------------------
# Snapshot lookup / creation
# ---------------------------------------------------------------------------

def get_or_create_snapshot(
    db: Session,
    advisor: Advisor,
    payload: AdvisorSnapshotPayload,
    business_date: date,
    import_batch_id: int,
) -> tuple[AdvisorMetricSnapshot, bool]:
    """
    Find an existing snapshot for:

        advisor
        + period year
        + period month
        + business/snapshot date

    Existing snapshot -> update.

    Missing snapshot -> insert.
    """

    period_month = month_to_number(payload.month)

    snapshot = db.scalar(
        select(AdvisorMetricSnapshot).where(
            AdvisorMetricSnapshot.advisor_id == advisor.id,
            AdvisorMetricSnapshot.period_year == payload.year,
            AdvisorMetricSnapshot.period_month == period_month,
            AdvisorMetricSnapshot.snapshot_date == business_date,
        )
    )

    if snapshot is None:
        snapshot = AdvisorMetricSnapshot(
            advisor_id=advisor.id,
            period_year=payload.year,
            period_month=period_month,
            snapshot_date=business_date,
        )

        db.add(snapshot)

        created = True

    else:
        created = False

    # ---------------------------------------------------------
    # Organization snapshot
    # ---------------------------------------------------------

    snapshot.branch = payload.branch
    snapshot.city = payload.city
    snapshot.designation = payload.designation
    snapshot.grade = payload.grade

    # ---------------------------------------------------------
    # Metrics
    # ---------------------------------------------------------

    metrics = payload.metrics

    # ---------------------------------------------------------
    # Total Veh
    # ---------------------------------------------------------

    snapshot.gus = _int_value(
        metrics.get("gus")
    )

    snapshot.pm = _int_value(
        metrics.get("pm")
    )

    # ---------------------------------------------------------
    # Product counts
    # ---------------------------------------------------------

    snapshot.tyre = _int_value(
        metrics.get("tyre")
    )

    snapshot.battery = _int_value(
        metrics.get("battery")
    )

    snapshot.injector_cleaner = _int_value(
        metrics.get("injector_cleaner")
    )

    snapshot.engine_flush = _int_value(
        metrics.get("engine_flush")
    )

    snapshot.bactakleen = _int_value(
        metrics.get("bactakleen")
    )

    snapshot.wheel_alignment = _int_value(
        metrics.get("wheel_alignment")
    )

    snapshot.smiles_amc = _int_value(
        metrics.get("smiles_amc")
    )

    # ---------------------------------------------------------
    # Product PM Conversion %
    # ---------------------------------------------------------

    snapshot.tyre_pm_conversion_pct = _float_value(
        metrics.get("tyre_pm_conversion_pct")
    )

    snapshot.battery_pm_conversion_pct = _float_value(
        metrics.get("battery_pm_conversion_pct")
    )

    snapshot.wheel_alignment_pm_conversion_pct = _float_value(
        metrics.get("wheel_alignment_pm_conversion_pct")
    )

    snapshot.smiles_amc_pm_conversion_pct = _float_value(
        metrics.get("smiles_amc_pm_conversion_pct")
    )

    snapshot.injector_cleaner_pm_conversion_pct = _float_value(
        metrics.get("injector_cleaner_pm_conversion_pct")
    )

    snapshot.engine_flush_pm_conversion_pct = _float_value(
        metrics.get("engine_flush_pm_conversion_pct")
    )

    snapshot.bactakleen_pm_conversion_pct = _float_value(
        metrics.get("bactakleen_pm_conversion_pct")
    )

    # ---------------------------------------------------------
    # VAS
    # ---------------------------------------------------------

    snapshot.vas_vehicles = _int_value(
        metrics.get("vas_vehicles")
    )

    snapshot.vas_treatments = _int_value(
        metrics.get("vas_treatments")
    )

    snapshot.vas_value = _decimal_value(
        metrics.get("vas_value")
    )

    # ---------------------------------------------------------
    # T-Gloss optional metrics
    # ---------------------------------------------------------

    snapshot.body_coating = _nullable_int(
        metrics.get("body_coating")
    )

    snapshot.ceramic_coating = _nullable_int(
        metrics.get("ceramic_coating")
    )

    snapshot.graphene = _nullable_int(
        metrics.get("graphene")
    )

    # ---------------------------------------------------------
    # DIY / Accessories
    # ---------------------------------------------------------

    snapshot.diy_value = _decimal_value(
        metrics.get("diy_value")
    )

    snapshot.accessories_value = _decimal_value(
        metrics.get("accessories_value")
    )

    # ---------------------------------------------------------
    # GS to BP Conversion
    # ---------------------------------------------------------

    snapshot.gs_to_bp_conversion = _int_value(
        metrics.get("gs_to_bp_conversion")
    )

    # ---------------------------------------------------------
    # NPS raw components
    # ---------------------------------------------------------

    snapshot.nps_sample = _int_value(
        metrics.get("nps_sample")
    )

    snapshot.nps_promoters = _int_value(
        metrics.get("nps_promoters")
    )

    snapshot.nps_neutral = _int_value(
        metrics.get("nps_neutral")
    )

    snapshot.nps_detractors = _int_value(
        metrics.get("nps_detractors")
    )

    # ---------------------------------------------------------
    # VOC
    # ---------------------------------------------------------

    snapshot.ivoc_responses = _int_value(
        metrics.get("ivoc_responses")
    )

    snapshot.tkm_voc = _int_value(
        metrics.get("tkm_voc")
    )

    # ---------------------------------------------------------
    # Import batch
    # ---------------------------------------------------------

    snapshot.import_batch_id = import_batch_id

    db.flush()

    return snapshot, created


# ---------------------------------------------------------------------------
# Main transactional import
# ---------------------------------------------------------------------------

def import_workbook_result(
    db: Session,
    result: IngestionResult,
    filename: str,
    business_date: date,
) -> dict[str, Any]:
    """
    Commit a validated ingestion result to the database.

    The caller controls the transaction boundary.

    If this function raises an exception, the API must rollback.
    """

    errors = [
        issue
        for issue in result.issues
        if issue.severity == "error"
    ]

    # ---------------------------------------------------------
    # Never import invalid data
    # ---------------------------------------------------------

    if errors:
        raise ValueError(
            f"Import rejected: {len(errors)} validation error(s)."
        )

    # ---------------------------------------------------------
    # Create ImportBatch
    # ---------------------------------------------------------

    import_batch = ImportBatch(
        filename=filename,
        status=ImportStatus.PENDING,
        business_date=business_date,
        business_date_end=business_date,
        rows_parsed=result.rows_parsed,
        rows_rejected=0,
    )

    db.add(import_batch)
    db.flush()

    rows_inserted = 0
    rows_updated = 0

    # ---------------------------------------------------------
    # Import every advisor snapshot
    # ---------------------------------------------------------

    for payload in result.snapshots:

        advisor, advisor_created = get_or_create_advisor(
            db,
            payload,
        )

        snapshot, snapshot_created = get_or_create_snapshot(
            db=db,
            advisor=advisor,
            payload=payload,
            business_date=business_date,
            import_batch_id=import_batch.id,
        )

        if snapshot_created:
            rows_inserted += 1
        else:
            rows_updated += 1

    # ---------------------------------------------------------
    # Mark import completed
    # ---------------------------------------------------------

    import_batch.status = ImportStatus.COMMITTED

    db.flush()

    return {
        "import_batch_id": import_batch.id,
        "filename": filename,
        "business_date": business_date.isoformat(),
        "rows_parsed": result.rows_parsed,
        "rows_inserted": rows_inserted,
        "rows_updated": rows_updated,
        "rows_rejected": 0,
        "status": "completed",
    }
