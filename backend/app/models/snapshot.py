"""
Advisor metric snapshot — the corrected data grain.

WHY THIS GRAIN (not "MonthlyMetric"):
The source workbook was re-inspected specifically for this question. Every
one of the 12 fact sheets has the SAME header shape:
    Month, Branch, City, Employee Number, Name, Designation, Grade, <metric...>
There is NO date/day column anywhere in the file, and no column that
distinguishes "this month's total" from "today's incremental activity".
The file's structural grain is (advisor, calendar month) — not (advisor,
day).

The business has since said the file will be uploaded/updated DAILY. Given
the file itself carries no day-level column, the only safe conclusion is:
each daily upload is a SNAPSHOT of the (advisor, month) state as of that
upload's business date. The current, still-open month's row is expected to
change from one day's upload to the next (most likely growing, since
metrics like GUS/PM/product counts describe cumulative business activity
within a month) — but we do NOT assume that. We simply store each day's
value as its own snapshot and NEVER sum snapshots of the same
(advisor, month) together, which is what the model + ingestion upsert key
below enforce structurally.

This one design safely supports every case in the follow-up requirement
without knowing in advance whether the data is cumulative or a full
replacement each day:
  - Daily "delta" for a specific day = snapshot(day) - snapshot(previous
    available day, same month) — a query-time computation (services will
    add this in the ingestion/reporting stage), never stored, so it can't
    go stale relative to its inputs.
  - Weekly = sum of daily deltas across the week, equivalently
    snapshot(week end) - snapshot(day before week start).
  - Month-to-Date = the LATEST snapshot within the still-open month. No
    summation needed — the latest snapshot already reflects everything
    up to that point, by definition of "snapshot".
  - Monthly total (closed month) = that month's FINAL snapshot (the last
    one recorded before the month rolled over) — not a sum of that
    month's snapshots.
  - YTD = sum of each CLOSED month's final snapshot + the current open
    month's latest snapshot. Never sum every daily snapshot across the
    year — that would double- or triple-count activity already captured
    in a later, larger snapshot.
  - Custom date range = snapshot(closest date <= range end) minus
    snapshot(closest date < range start), computed per month and summed
    across months if the range spans more than one.

Grain: one row per (advisor, period_year, period_month, snapshot_date).
Re-uploading the same day's file upserts this exact row (see the unique
constraint) rather than creating a duplicate — required by the "safe
re-upload" rule.
"""
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AdvisorMetricSnapshot(Base):
    """
    A single day's as-of state of one advisor's metrics for one calendar
    month. NOT a daily activity record and NOT a finalized monthly total
    on its own — those are both derived at query time (see module
    docstring). Renamed from the earlier "MonthlyMetric" because that name
    implied "one row = one month's final total", which the source data
    does not support once daily re-uploads are in play.
    """

    __tablename__ = "advisor_metric_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "advisor_id", "period_year", "period_month", "snapshot_date",
            name="uq_advisor_period_snapshot_date",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    advisor_id: Mapped[int] = mapped_column(ForeignKey("advisors.id"), index=True, nullable=False)
    advisor: Mapped["Advisor"] = relationship(back_populates="snapshots")

    # The calendar month this snapshot's figures belong to (from the
    # sheet's "Month" column) — independent of when the snapshot was taken.
    period_year: Mapped[int] = mapped_column(nullable=False, index=True)
    period_month: Mapped[int] = mapped_column(nullable=False, index=True)  # 1-12

    # The business/data date this snapshot represents — i.e. the upload's
    # business_date (see ImportBatch). This is what makes rows for the
    # same (advisor, month) distinct instead of overwriting each other,
    # and what "latest snapshot in period" queries order by.
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # --- Snapshot of the advisor's org info as of this date. Kept per-row
    # (not just on Advisor) because branch/grade can change and history
    # must not be rewritten retroactively.
    branch: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(10), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # --- Total Veh sheet
    gus: Mapped[int] = mapped_column(default=0)
    pm: Mapped[int] = mapped_column(default=0)

    # --- Single-product upsell sheets
    tyre: Mapped[int] = mapped_column(default=0)
    battery: Mapped[int] = mapped_column(default=0)
    injector_cleaner: Mapped[int] = mapped_column(default=0)
    engine_flush: Mapped[int] = mapped_column(default=0)
    bactakleen: Mapped[int] = mapped_column(default=0)
    wheel_alignment: Mapped[int] = mapped_column(default=0)
    smiles_amc: Mapped[int] = mapped_column(default=0)
        # --- Product PM conversion percentages
    tyre_pm_conversion_pct: Mapped[float] = mapped_column(default=0)
    battery_pm_conversion_pct: Mapped[float] = mapped_column(default=0)
    wheel_alignment_pm_conversion_pct: Mapped[float] = mapped_column(default=0)
    smiles_amc_pm_conversion_pct: Mapped[float] = mapped_column(default=0)
    injector_cleaner_pm_conversion_pct: Mapped[float] = mapped_column(default=0)
    engine_flush_pm_conversion_pct: Mapped[float] = mapped_column(default=0)
    bactakleen_pm_conversion_pct: Mapped[float] = mapped_column(default=0)


    # --- T-Gloss sheet (currency uses Numeric, not float, to avoid
    # rounding drift on money)
    vas_vehicles: Mapped[int] = mapped_column(default=0)
    vas_treatments: Mapped[int] = mapped_column(default=0)
    vas_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    body_coating: Mapped[int | None] = mapped_column(nullable=True)
    ceramic_coating: Mapped[int | None] = mapped_column(nullable=True)
    graphene: Mapped[int | None] = mapped_column(nullable=True)

    # --- DIY / ACC sheets (currency)
    diy_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    accessories_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    # --- GS to BP Conv sheet
    gs_to_bp_conversion: Mapped[int] = mapped_column(default=0)

    # --- NPS sheet — raw components only, never a pre-computed NPS %,
    # so any aggregation derives from summed/latest Promoters/Detractors/
    # Sample rather than averaging percentages.
    nps_sample: Mapped[int] = mapped_column(default=0)
    nps_promoters: Mapped[int] = mapped_column(default=0)
    nps_neutral: Mapped[int] = mapped_column(default=0)
    nps_detractors: Mapped[int] = mapped_column(default=0)

    # --- VOC sheet
    ivoc_responses: Mapped[int] = mapped_column(default=0)  # count, not a satisfaction score
    tkm_voc: Mapped[int] = mapped_column(default=0)  # kept in schema; empty/unused in source data

    import_batch_id: Mapped[int | None] = mapped_column(ForeignKey("import_batches.id"), nullable=True)

    def __repr__(self) -> str:
        return (
            f"<AdvisorMetricSnapshot advisor_id={self.advisor_id} "
            f"period={self.period_year}-{self.period_month:02d} as_of={self.snapshot_date}>"
        )
