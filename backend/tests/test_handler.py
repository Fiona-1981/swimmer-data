from decimal import Decimal

import pytest

from handler import ValidationError, build_items, validate

SESSION_ID = "2026-10-16T16:17:19.123Z-a1b2c3"


def make_rep(rep_number, **overrides):
    rep = {
        "repNumber": rep_number,
        "protocol": "All out",
        "rate": 52,
        "time": Decimal("18.42"),
        "tags": [],
    }
    return {**rep, **overrides}


def make_payload(**overrides):
    payload = {"swimmerId": "fiona", "sessionId": SESSION_ID, "reps": [make_rep(1)]}
    return {**payload, **overrides}


def test_validate_returns_swimmer_session_and_reps():
    payload = make_payload()
    assert validate(payload) == ("fiona", SESSION_ID, payload["reps"])


@pytest.mark.parametrize("session_id", [
    "2026-10-16T16:17:19Z-a1b2c3",       # no milliseconds
    "2026-10-16T16:17:19.123Z",          # no suffix
    "2026-10-16T16:17:19.123Z-A1B2C3",   # uppercase suffix
    "2026-10-16T16:17:19.123Z-a1b2c",    # suffix too short
    "2026-13-16T16:17:19.123Z-a1b2c3",   # month 13
    "2026-10-16T16:17:19.123+01:00-a1b2c3",  # not UTC
    123,
])
def test_validate_rejects_bad_session_id(session_id):
    with pytest.raises(ValidationError, match="sessionId"):
        validate(make_payload(sessionId=session_id))


def test_validate_rejects_duplicate_rep_numbers():
    payload = make_payload(reps=[make_rep(1), make_rep(2), make_rep(1)])
    with pytest.raises(ValidationError, match="repNumber 1 appears more than once"):
        validate(payload)


@pytest.mark.parametrize("rep_number", [0, 1000, -1, Decimal("1.5"), "1", True, None])
def test_validate_rejects_bad_rep_number(rep_number):
    with pytest.raises(ValidationError, match="repNumber"):
        validate(make_payload(reps=[make_rep(rep_number)]))


@pytest.mark.parametrize("rep_number", [1, 999])
def test_validate_accepts_rep_number_limits(rep_number):
    validate(make_payload(reps=[make_rep(rep_number)]))


def test_build_items_session_item():
    session, *_ = build_items("fiona", SESSION_ID, [make_rep(1)])
    assert session == {
        "PK": "SWIMMER#fiona",
        "SK": f"SESSION#{SESSION_ID}",
        "type": "session",
        "swimmerId": "fiona",
        "startedAt": "2026-10-16T16:17:19.123Z",
    }


def test_build_items_rep_item():
    _, rep = build_items("fiona", SESSION_ID, [make_rep(7, note="breathed on 3")])
    assert rep == {
        "PK": "SWIMMER#fiona",
        "SK": f"SESSION#{SESSION_ID}#REP#007",
        "type": "rep",
        "repNumber": 7,
        "protocol": "All out",
        "rate": 52,
        "time": Decimal("18.42"),
        "tags": [],
        "note": "breathed on 3",
    }


@pytest.mark.parametrize("rep_number, suffix", [(1, "001"), (42, "042"), (999, "999")])
def test_build_items_zero_pads_rep_number(rep_number, suffix):
    _, rep = build_items("fiona", SESSION_ID, [make_rep(rep_number)])
    assert rep["SK"] == f"SESSION#{SESSION_ID}#REP#{suffix}"


def test_build_items_leaves_out_empty_note():
    _, rep = build_items("fiona", SESSION_ID, [make_rep(1, note="")])
    assert "note" not in rep


def test_build_items_is_repeatable():
    # Same input, same items: what makes a retried save land in the same place
    reps = [make_rep(1), make_rep(2)]
    assert build_items("fiona", SESSION_ID, reps) == build_items("fiona", SESSION_ID, reps)
