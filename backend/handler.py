import base64
import json
import os
import re
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.types import TypeSerializer

TABLE_NAME = os.environ["TABLE_NAME"]

# Keep in step with frontend/src/lib/protocols.ts
PROTOCOLS = {"All out", "Fastest movement", "50 pace", "100 pace", "200 pace", "Race footage"}

# A DynamoDB transaction holds at most 100 items: 1 session item + up to 99 reps
MAX_REPS = 99
MAX_REP_NUMBER = 999

# e.g. 2026-10-16T16:17:19.123Z-a1b2c3: the browser's new Date().toISOString()
# plus a random suffix, so two devices starting at the same moment don't clash.
SESSION_ID_PATTERN = re.compile(
    r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-[a-z0-9]{6}"
)

dynamodb = boto3.client("dynamodb")
serializer = TypeSerializer()


class ValidationError(Exception):
    pass


def response(status, body):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def parse_body(event):
    body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")
    try:
        return json.loads(body, parse_float=Decimal)
    except json.JSONDecodeError:
        raise ValidationError("Body must be valid JSON")


def is_number(value):
    return isinstance(value, (int, Decimal)) and not isinstance(value, bool)


def started_at(session_id):
    """The timestamp part of a session ID, or None if the ID is malformed."""
    match = SESSION_ID_PATTERN.fullmatch(session_id)
    if not match:
        return None
    timestamp = match.group(1)
    # The pattern only checks the shape; this rejects e.g. month 13
    try:
        datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        return None
    return timestamp


def validate(payload):
    if not isinstance(payload, dict):
        raise ValidationError("Body must be a JSON object")

    swimmer_id = payload.get("swimmerId")
    if not isinstance(swimmer_id, str) or not re.fullmatch(r"[a-z0-9-]{1,40}", swimmer_id):
        raise ValidationError("swimmerId must be 1-40 lowercase letters, numbers or hyphens")

    session_id = payload.get("sessionId")
    if not isinstance(session_id, str) or started_at(session_id) is None:
        raise ValidationError(
            "sessionId must look like 2026-10-16T16:17:19.123Z-a1b2c3"
        )

    reps = payload.get("reps")
    if not isinstance(reps, list) or not 1 <= len(reps) <= MAX_REPS:
        raise ValidationError(f"reps must be a list of 1 to {MAX_REPS} items")

    seen_rep_numbers = set()
    for n, rep in enumerate(reps, start=1):
        if not isinstance(rep, dict):
            raise ValidationError(f"Rep {n} must be an object")
        rep_number = rep.get("repNumber")
        # bool is a subclass of int in Python, so rule it out explicitly
        if (
            not isinstance(rep_number, int)
            or isinstance(rep_number, bool)
            or not 1 <= rep_number <= MAX_REP_NUMBER
        ):
            raise ValidationError(
                f"Rep {n}: repNumber must be a whole number from 1 to {MAX_REP_NUMBER}"
            )
        # Two Puts on the same key would also make DynamoDB reject the transaction
        if rep_number in seen_rep_numbers:
            raise ValidationError(f"Rep {n}: repNumber {rep_number} appears more than once")
        seen_rep_numbers.add(rep_number)
        if rep.get("protocol") not in PROTOCOLS:
            raise ValidationError(f"Rep {n}: unknown protocol")
        if not is_number(rep.get("rate")) or not 0 < rep["rate"] <= 200:
            raise ValidationError(f"Rep {n}: rate must be a number between 0 and 200")
        if not is_number(rep.get("time")) or not 0 < rep["time"] <= 600:
            raise ValidationError(f"Rep {n}: time must be seconds between 0 and 600")
        tags = rep.get("tags", [])
        if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
            raise ValidationError(f"Rep {n}: tags must be a list of strings")
        note = rep.get("note", "")
        if not isinstance(note, str) or len(note) > 500:
            raise ValidationError(f"Rep {n}: note must be text under 500 characters")

    return swimmer_id, session_id, reps


def build_items(swimmer_id, session_id, reps):
    # Every key and value comes from the request, nothing from the clock, so
    # the same request always builds exactly the same items
    pk = f"SWIMMER#{swimmer_id}"
    session_sk = f"SESSION#{session_id}"

    items = [{
        "PK": pk,
        "SK": session_sk,
        "type": "session",
        "swimmerId": swimmer_id,
        "startedAt": started_at(session_id),
    }]
    for rep in reps:
        item = {
            "PK": pk,
            # Zero-padded so reps sort as 001, 002 ... 010, not 1, 10, 2
            "SK": f"{session_sk}#REP#{rep['repNumber']:03d}",
            "type": "rep",
            "repNumber": rep["repNumber"],
            "protocol": rep["protocol"],
            "rate": rep["rate"],
            "time": rep["time"],
            "tags": rep.get("tags", []),
        }
        if rep.get("note"):
            item["note"] = rep["note"]
        items.append(item)
    return items


def handler(event, context):
    try:
        swimmer_id, session_id, reps = validate(parse_body(event))
    except ValidationError as error:
        return response(400, {"error": str(error)})

    items = build_items(swimmer_id, session_id, reps)

    # Plain Puts overwrite whatever is at the same key, so sending the same
    # session again (e.g. a retry) leaves the table exactly as it was
    dynamodb.transact_write_items(TransactItems=[
        {
            "Put": {
                "TableName": TABLE_NAME,
                "Item": {key: serializer.serialize(value) for key, value in item.items()},
            }
        }
        for item in items
    ])

    return response(200, {
        "sessionId": session_id,
        "savedRepNumbers": sorted(rep["repNumber"] for rep in reps),
    })
