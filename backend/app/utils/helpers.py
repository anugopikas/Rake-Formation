from __future__ import annotations


def safe_string(value: str | None) -> str:
    return value.strip() if value else ""
