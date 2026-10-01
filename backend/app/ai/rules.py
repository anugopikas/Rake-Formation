from typing import Tuple


def validate_max_wagons(required_wagons: int, max_allowed: int = 58) -> bool:
    return required_wagons <= max_allowed


def validate_railway_rules(required_wagons: int, quantity: int, order_priority: str) -> tuple[bool, str | None]:
    if required_wagons > 10:
        return False, "Selected formation exceeds the maximum allowed wagon count."
    if quantity > 5000:
        return False, "Requested quantity exceeds the safe rake capacity."
    if order_priority.upper() == "LOW" and required_wagons > 3:
        return False, "Low-priority orders must use fewer wagons."
    return True, None


def get_estimated_delivery_time(origin: str, destination: str) -> str:
    mapping: dict[Tuple[str, str], str] = {
        ("Salem", "Chennai"): "18 hours",
        ("Chennai", "Bangalore"): "12 hours",
        ("Delhi", "Mumbai"): "24 hours",
        ("Kolkata", "Patna"): "20 hours",
        ("Hyderabad", "Vijayawada"): "14 hours",
    }

    key = (origin.title(), destination.title())
    return mapping.get(key, "72 hours")
