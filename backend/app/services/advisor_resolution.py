"""
Advisor identity resolution — DB-aware layer on top of the pure
normalize_name()/resolve_identity_key() functions in identity.py.

Handles the identity-TRANSITION case: an advisor who first appeared with
no Employee Number (identity_key = normalized name) later appears WITH one
(e.g. issued in March after starting in January). Without this, ingestion
would silently create a second, disconnected Advisor row and split that
person's history in two.

Resolution order, given (employee_number, raw_name) from an ingested row:

1. employee_number provided, and an Advisor already has that exact
   employee_number -> use it. (Normal repeat case.)

2. employee_number provided, but no Advisor has it yet -> look for an
   existing Advisor with NO employee_number whose normalized_name matches.
     - Exactly one match -> TRANSITION: promote that advisor in place
       (set employee_number, update identity_key to it). Same advisor_id,
       so history stays attached. This is the "unambiguous" case the
       requirement describes.
     - Zero matches -> create a new Advisor keyed by employee_number.
     - More than one match -> AMBIGUOUS. Do not guess which existing
       name-only advisor this belongs to (e.g. two different trainees
       both named "Arun Kumar" at different branches). Create a new
       Advisor keyed by the employee_number so the row still gets
       ingested, but the result is flagged so ingestion can surface it
       for manual review rather than silently merging the wrong person.

3. No employee_number provided -> look up by identity_key = normalized
   name directly (covers the normal repeat case for name-only advisors).
   If not found, ALSO check whether an advisor with an employee_number
   already has this normalized_name (covers a row arriving late/out of
   order with no number for someone already known by number) — if exactly
   one, attach to it; if multiple, flag ambiguous and create a new
   name-keyed advisor rather than guessing.

This function performs DB reads/writes (add, flush) but never commits —
the caller (ingestion service, to be built) owns the transaction so a
whole batch can be rolled back together on failure, per the "invalid
upload must not modify existing data" requirement.
"""
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.advisor import Advisor
from app.services.identity import normalize_name


@dataclass
class AdvisorResolution:
    advisor: Advisor
    created: bool = False
    transitioned: bool = False  # name-only advisor was just promoted to an employee number
    ambiguous: bool = False     # multiple candidate matches existed; caller should flag for review


def find_or_create_advisor(db: Session, employee_number: str | None, raw_name: str) -> AdvisorResolution:
    cleaned_number = employee_number.strip() if employee_number else None
    normalized = normalize_name(raw_name)

    if cleaned_number:
        # 1. Exact employee-number match — the normal repeat case.
        existing = db.execute(
            select(Advisor).where(Advisor.employee_number == cleaned_number)
        ).scalar_one_or_none()
        if existing is not None:
            return AdvisorResolution(advisor=existing)

        # 2. Look for a name-only advisor this number might belong to.
        name_only_candidates = db.execute(
            select(Advisor).where(
                Advisor.employee_number.is_(None),
                Advisor.normalized_name == normalized,
            )
        ).scalars().all()

        if len(name_only_candidates) == 1:
            candidate = name_only_candidates[0]
            candidate.employee_number = cleaned_number
            candidate.identity_key = cleaned_number
            candidate.display_name = raw_name
            db.flush()
            return AdvisorResolution(advisor=candidate, transitioned=True)

        ambiguous = len(name_only_candidates) > 1
        new_advisor = Advisor(
            employee_number=cleaned_number,
            display_name=raw_name,
            normalized_name=normalized,
            identity_key=cleaned_number,
        )
        db.add(new_advisor)
        db.flush()
        return AdvisorResolution(advisor=new_advisor, created=True, ambiguous=ambiguous)

    # No employee number on this row.
    existing = db.execute(
        select(Advisor).where(Advisor.identity_key == normalized)
    ).scalar_one_or_none()
    if existing is not None:
        return AdvisorResolution(advisor=existing)

    numbered_candidates = db.execute(
        select(Advisor).where(
            Advisor.employee_number.is_not(None),
            Advisor.normalized_name == normalized,
        )
    ).scalars().all()

    if len(numbered_candidates) == 1:
        return AdvisorResolution(advisor=numbered_candidates[0])

    ambiguous = len(numbered_candidates) > 1
    new_advisor = Advisor(
        employee_number=None,
        display_name=raw_name,
        normalized_name=normalized,
        identity_key=normalized,
    )
    db.add(new_advisor)
    db.flush()
    return AdvisorResolution(advisor=new_advisor, created=True, ambiguous=ambiguous)
