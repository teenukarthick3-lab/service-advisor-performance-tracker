"""
Import batch — one row per Excel upload, for traceability and history.

Expanded per the corrected requirements to capture the BUSINESS date (or
date range) the uploaded file represents, separately from the upload
TIMESTAMP (when the upload happened) — these are different things once
uploads are daily: a file uploaded on Aug 5 at 9am represents business
data "as of Aug 4" (yesterday's close) as often as it represents "as of
today". The ingestion stage (not built yet) will set business_date from
either an explicit field the uploader provides or a sensible default;
that decision belongs there, not in this model.

A batch moves through PENDING (parsed + validated, not yet written) ->
COMMITTED (upserted) or FAILED (validation failed, nothing written).
Failed batches never touch advisor_metric_snapshots — the "invalid upload
must not modify existing committed data" rule is enforced by the
ingestion service wrapping the whole commit in one DB transaction, not by
anything in this model.
"""
import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ImportStatus(str, enum.Enum):
    PENDING = "pending"
    COMMITTED = "committed"
    FAILED = "failed"


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[ImportStatus] = mapped_column(Enum(ImportStatus), default=ImportStatus.PENDING)

    # The business/data date this file represents. For a single-day
    # snapshot upload this is the only date set. For a file that turned
    # out to contain a range (e.g. a backfill), business_date is the
    # range start and business_date_end is set too.
    business_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    business_date_end: Mapped[date | None] = mapped_column(Date, nullable=True)

    rows_parsed: Mapped[int] = mapped_column(Integer, default=0)
    rows_inserted: Mapped[int] = mapped_column(Integer, default=0)
    rows_updated: Mapped[int] = mapped_column(Integer, default=0)
    rows_rejected: Mapped[int] = mapped_column(Integer, default=0)

    # Short, human-readable summary of validation errors (e.g. "3 rows
    # skipped: ambiguous advisor name match"). Full row-level detail is
    # returned to the client at preview time but intentionally not
    # persisted in full here, to avoid unbounded growth of this table —
    # if per-row audit detail becomes a real requirement later, that's a
    # separate ImportBatchRow table, not more text crammed in this field.
    error_summary: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    def __repr__(self) -> str:
        return f"<ImportBatch id={self.id} file={self.filename!r} status={self.status}>"
