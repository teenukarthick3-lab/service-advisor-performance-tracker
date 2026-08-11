"""
Advisor identity resolution.

Confirmed business rule:
  1. Employee Number if available -> that is the identity key.
  2. Otherwise -> normalized Service Advisor Name is the identity key.
  3. Never generate artificial IDs.
  4. Normalize names so formatting differences (case, extra spaces) don't
     create duplicate advisor records across monthly uploads.

This is intentionally the only place name/employee-number matching logic
lives, so if the business later confirms Employee Numbers become
mandatory, only this function needs to change.
"""
import re


def normalize_name(raw_name: str) -> str:
    """
    Normalize a Service Advisor name for MATCHING purposes only.

    - Strips leading/trailing whitespace
    - Collapses any run of internal whitespace to a single space
    - Case-folds (uppercase) for comparison

    Never use this value for display — keep the original `display_name`
    separately, per the confirmed decision.
    """
    collapsed = re.sub(r"\s+", " ", raw_name.strip())
    return collapsed.upper()


def resolve_identity_key(employee_number: str | None, raw_name: str) -> str:
    """
    Return the identity key used to match an advisor across uploads.

    Employee number (stripped) wins when present and non-empty; otherwise
    fall back to the normalized name. Raises if neither is usable, since a
    row with no name and no employee number cannot be identified at all
    and should be rejected by validation before reaching this function.
    """
    if employee_number is not None:
        cleaned = employee_number.strip()
        if cleaned:
            return cleaned

    normalized = normalize_name(raw_name)
    if not normalized:
        raise ValueError("Cannot resolve advisor identity: no employee number and no usable name.")
    return normalized
