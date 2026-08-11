from pathlib import Path

from app.services.excel_ingestion import parse_workbook


WORKBOOK = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "Service Advisor Performance Tracker 2026 - Group.xlsx"
)


def test_real_workbook_can_be_parsed():
    result = parse_workbook(WORKBOOK)

    assert result.rows_parsed == 254

    errors = [
        issue
        for issue in result.issues
        if issue.severity == "error"
    ]

    assert errors == []


def test_real_workbook_contains_expected_metrics():
    result = parse_workbook(WORKBOOK)

    assert result.snapshots

    first = result.snapshots[0]

    assert "gus" in first.metrics
    assert "pm" in first.metrics
    assert "tyre" in first.metrics
    assert "battery" in first.metrics
    assert "vas_value" in first.metrics
    assert "nps_sample" in first.metrics
    assert "nps_promoters" in first.metrics
    assert "ivoc_responses" in first.metrics


def test_workbook_contains_six_months():
    result = parse_workbook(WORKBOOK)

    months = {
        snapshot.month
        for snapshot in result.snapshots
    }

    assert months == {
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
    }


def test_nps_raw_components_are_preserved():
    result = parse_workbook(WORKBOOK)

    for snapshot in result.snapshots:
        assert "nps_sample" in snapshot.metrics
        assert "nps_promoters" in snapshot.metrics
        assert "nps_neutral" in snapshot.metrics
        assert "nps_detractors" in snapshot.metrics


def test_vas_currency_is_preserved():
    result = parse_workbook(WORKBOOK)

    snapshots_with_vas = [
        snapshot
        for snapshot in result.snapshots
        if snapshot.metrics.get("vas_value") is not None
    ]

    assert snapshots_with_vas

    for snapshot in snapshots_with_vas:
        assert isinstance(
            snapshot.metrics["vas_value"],
            (int, float),
        )


def test_tkm_voc_is_preserved():
    result = parse_workbook(WORKBOOK)

    assert any(
        "tkm_voc" in snapshot.metrics
        for snapshot in result.snapshots
    )


def test_identity_information_is_preserved():
    result = parse_workbook(WORKBOOK)

    for snapshot in result.snapshots:
        assert snapshot.identity_key
        assert snapshot.display_name
        assert snapshot.normalized_name
