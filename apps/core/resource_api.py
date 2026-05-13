from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class ResourceQueryOptions:
    includes: tuple[str, ...] = ()
    fields: tuple[str, ...] | None = None


def parse_csv_param(value: str | None) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(
        item.strip()
        for item in value.split(",")
        if item and item.strip()
    )


def parse_resource_query_options(request, resource: str) -> ResourceQueryOptions:
    includes = parse_csv_param(_get_query_param(request, "include"))
    fields = parse_csv_param(_get_query_param(request, f"fields[{resource}]"))
    return ResourceQueryOptions(
        includes=includes,
        fields=fields or None,
    )


def merge_resource_includes(*include_groups: Iterable[str]) -> tuple[str, ...]:
    ordered: list[str] = []
    seen: set[str] = set()
    for group in include_groups:
        for item in group:
            normalized = (item or "").strip()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            ordered.append(normalized)
    return tuple(ordered)


def _get_query_param(request, key: str) -> str | None:
    getter = getattr(getattr(request, "GET", None), "get", None)
    if getter is None:
        return None
    value = getter(key)
    if value is None:
        return None
    return str(value)
