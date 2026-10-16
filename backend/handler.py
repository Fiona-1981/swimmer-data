import base64
import json
import os
import re
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.types import TypeSerializer

TABLE_NAME = os.environ["TABLE_NAME"]

# Keep in step with frontend/src/lib/protocols.ts
PROTOCOLS = {"All out", "Fastest movement", "50 pace", "100 pace", "200 pace", "Race footage"}

# A DynamoDB transaction holds at most 100 items: 1 session item + up to 99 reps
MAX_REPS = 99

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


def validate(payload):
    if not isinstance(payload, dict):
        raise ValidationError("Body must be a JSON object")

    swimmer_id = payload.get("swimmerId")
    if not isinstance(swimmer_id, str) or not re.fullmatch(r"[a-z0-9-]{1,40}", swimmer_id):
        raise ValidationError("swimmerId must be 1-40 lowercase letters, numbers or hyphens")

    reps = payload.get("reps")
    if not isinstance(reps, list) or not 1 <= len(reps) <= MAX_REPS:
        raise ValidationError(f"reps must be a list of 1 to {MAX_REPS} items")

    for n, rep in enumerate(reps, start=1):
        if not isinstance(rep, dict):
            raise ValidationError(f"Rep {n} must be an object")
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

    return swimmer_id, reps


def build_items(swimmer_id, reps, created_at):
    pk = f"SWIMMER#{swimmer_id}"
    session_sk = f"SESSION#{created_at}"

    items = [{
        "PK": pk,
        "SK": session_sk,
        "type": "session",
        "createdAt": created_at,
        "repCount": len(reps),
    }]
    for n, rep in enumerate(reps, start=1):
        item = {
            "PK": pk,
            "SK": f"{session_sk}#REP#{n:02d}",
            "type": "rep",
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
        swimmer_id, reps = validate(parse_body(event))
    except ValidationError as error:
        return response(400, {"error": str(error)})

    created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    items = build_items(swimmer_id, reps, created_at)

    dynamodb.transact_write_items(TransactItems=[
        {
            "Put": {
                "TableName": TABLE_NAME,
                "Item": {key: serializer.serialize(value) for key, value in item.items()},
                "ConditionExpression": "attribute_not_exists(PK)",
            }
        }
        for item in items
    ])

    return response(201, {"sessionId": created_at, "repCount": len(reps)})