import pytest

from app.services.identity import normalize_name, resolve_identity_key


def test_normalize_name_trims_and_collapses_and_uppercases():
    assert normalize_name("  Arun   Kumar ") == "ARUN KUMAR"
    assert normalize_name("ARUN KUMAR") == "ARUN KUMAR"
    assert normalize_name("Arun Kumar") == "ARUN KUMAR"


def test_resolve_identity_key_prefers_employee_number():
    assert resolve_identity_key("CAA0442", "Ambika M") == "CAA0442"


def test_resolve_identity_key_strips_employee_number_whitespace():
    assert resolve_identity_key("  CAA0442  ", "Ambika M") == "CAA0442"


def test_resolve_identity_key_falls_back_to_normalized_name():
    assert resolve_identity_key(None, "Arun  Kumar") == "ARUN KUMAR"
    assert resolve_identity_key("", "Arun Kumar") == "ARUN KUMAR"


def test_resolve_identity_key_same_name_different_formatting_matches():
    key1 = resolve_identity_key(None, "Arun Kumar")
    key2 = resolve_identity_key(None, "ARUN   KUMAR")
    key3 = resolve_identity_key(None, "  arun kumar  ".upper())
    assert key1 == key2 == key3


def test_resolve_identity_key_raises_with_no_usable_identity():
    with pytest.raises(ValueError):
        resolve_identity_key(None, "   ")
