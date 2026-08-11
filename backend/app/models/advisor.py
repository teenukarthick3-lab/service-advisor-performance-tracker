"""
Advisor identity.

Business rule (confirmed): an advisor is identified by Employee Number when
available; otherwise by their normalized name. Both the original display
name and the normalized matching value are kept, per the confirmed decision
to never conflate the two.

`identity_key` is the single column ingestion matches on: it is the
employee number when present, else the normalized name. It is unique so a
name-only advisor can't accidentally be inserted twice across uploads.
"""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Advisor(Base):
    __tablename__ = "advisors"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Raw employee number as it appears in the source file. Null for
    # advisors who only ever appeared without one (e.g. some trainees).
    employee_number: Mapped[str | None] = mapped_column(String(32), unique=True, index=True, nullable=True)

    # Name exactly as last seen in an upload — for display only.
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # Trimmed, whitespace-collapsed, case-folded name — used only for
    # matching, never shown to the user.
    normalized_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)

    # employee_number if present, else normalized_name. What ingestion
    # actually joins on. See services/identity.py for how this is derived.
    identity_key: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)

    snapshots: Mapped[list["AdvisorMetricSnapshot"]] = relationship(back_populates="advisor")

    def __repr__(self) -> str:
        return f"<Advisor id={self.id} name={self.display_name!r} key={self.identity_key!r}>"
