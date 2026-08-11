import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
# Import all models so Base.metadata knows about every table.
import app.models  # noqa: F401
from app.services.advisor_resolution import find_or_create_advisor


@pytest.fixture()
def db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        yield session


def test_creates_new_advisor_keyed_by_employee_number(db):
    result = find_or_create_advisor(db, "CAA0442", "Ambika M")
    assert result.created is True
    assert result.advisor.employee_number == "CAA0442"
    assert result.advisor.identity_key == "CAA0442"


def test_creates_new_advisor_keyed_by_name_when_no_employee_number(db):
    result = find_or_create_advisor(db, None, "Arun Kumar")
    assert result.created is True
    assert result.advisor.employee_number is None
    assert result.advisor.identity_key == "ARUN KUMAR"
    assert result.advisor.display_name == "Arun Kumar"  # original casing preserved for display


def test_repeat_upload_same_employee_number_reuses_advisor(db):
    first = find_or_create_advisor(db, "CAA0442", "Ambika M")
    second = find_or_create_advisor(db, "CAA0442", "Ambika M")
    assert first.advisor.id == second.advisor.id
    assert second.created is False


def test_repeat_upload_same_name_different_formatting_reuses_advisor(db):
    jan = find_or_create_advisor(db, None, "Arun Kumar")
    feb = find_or_create_advisor(db, None, "ARUN   KUMAR")
    assert jan.advisor.id == feb.advisor.id


def test_identity_transition_name_then_employee_number_unambiguous(db):
    """
    January: no employee number, name-only advisor created.
    March: same person appears with an employee number for the first
    time. This must promote the SAME advisor row, not create a second one.
    """
    jan = find_or_create_advisor(db, None, "Arun Kumar")
    assert jan.advisor.employee_number is None

    march = find_or_create_advisor(db, "12345", "Arun Kumar")

    assert march.advisor.id == jan.advisor.id, "must be the same advisor, not a new one"
    assert march.transitioned is True
    assert march.advisor.employee_number == "12345"
    assert march.advisor.identity_key == "12345"

    # And the identity has fully moved to the employee number — a later
    # upload with no employee number for this person must now resolve to
    # the SAME advisor via the numbered-candidate fallback, not create yet
    # another name-only duplicate.
    later = find_or_create_advisor(db, None, "Arun Kumar")
    assert later.advisor.id == jan.advisor.id


def test_identity_transition_does_not_merge_when_ambiguous(db):
    """
    Two different people happen to share a normalized name and neither had
    an employee number yet. A new employee number arriving for "one of
    them" must NOT auto-merge into either — that would silently attribute
    one person's history to the wrong person.
    """
    person_a = find_or_create_advisor(db, None, "Arun Kumar")
    # Force a second, distinct name-only advisor with the same normalized
    # name (simulates two different real people sharing a name).
    from app.models.advisor import Advisor
    person_b = Advisor(
        employee_number=None,
        display_name="Arun Kumar",
        normalized_name="ARUN KUMAR",
        identity_key="ARUN KUMAR__dup",  # DB unique constraint workaround for the test setup
    )
    db.add(person_b)
    db.flush()

    result = find_or_create_advisor(db, "99999", "Arun Kumar")

    assert result.ambiguous is True
    assert result.created is True
    # Must NOT have been merged into either existing candidate.
    assert result.advisor.id not in (person_a.advisor.id, person_b.id)


def test_ambiguous_reverse_case_numbered_candidates_not_merged(db):
    """
    Two people already have employee numbers and share a normalized name.
    A later row with NO employee number for "one of them" must not guess
    which one it belongs to.
    """
    find_or_create_advisor(db, "111", "Arun Kumar")
    find_or_create_advisor(db, "222", "Arun Kumar")

    result = find_or_create_advisor(db, None, "Arun Kumar")

    assert result.ambiguous is True
    assert result.created is True
    assert result.advisor.employee_number is None
