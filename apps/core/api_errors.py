from __future__ import annotations

from typing import Any
from uuid import uuid4

from django.http import JsonResponse


def api_error(
    message: str,
    *,
    status: int = 400,
    code: str | None = None,
    field_errors: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> JsonResponse:
    resolved_request_id = request_id or uuid4().hex
    payload = {
        "error": message,
        "message": message,
        "code": code or _default_error_code(status),
        "field_errors": field_errors or {},
        "request_id": resolved_request_id,
    }
    return JsonResponse(payload, status=status)


def _default_error_code(status: int) -> str:
    if status == 401:
        return "unauthorized"
    if status == 403:
        return "forbidden"
    if status == 404:
        return "not_found"
    if status >= 500:
        return "server_error"
    return "bad_request"
