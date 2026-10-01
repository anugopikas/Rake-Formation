from math import ceil
from typing import Optional

from sqlalchemy.orm import Session

from app import models


def select_best_plant(
    db: Session,
    material_name: str,
    required_quantity: int,
    destination: str,
) -> Optional[models.Plant]:

    candidates = (
        db.query(models.Plant)
        .filter(models.Plant.active.is_(True))
        .all()
    )

    ranked_candidates = []

    for plant in candidates:

        # Plant capacity check
        if plant.capacity_tons < required_quantity:
            continue

        # Inventory check
        inventory_item = (
            db.query(models.InventoryItem)
            .filter(models.InventoryItem.item_name == material_name)
            .filter(models.InventoryItem.location == plant.region)
            .first()
        )

        if inventory_item is None:
            continue

        if inventory_item.available_units < required_quantity:
            continue

        # IMPORTANT:
        # Do NOT reject plant when freight rate is missing.
        # The planner will handle missing freight as REVIEW REQUIRED.
        freight_rate = find_freight_rate(
            db,
            destination=destination,
            origin=plant.region,
        )

        # Wagon capacity check
        available_wagons = (
            db.query(models.Wagon)
            .filter(models.Wagon.available.is_(True))
            .all()
        )

        total_capacity = sum(
            wagon.max_capacity_tons
            for wagon in available_wagons
        )

        if total_capacity < required_quantity:
            continue

        score = 0

        if inventory_item.available_units >= required_quantity:
            score += 20

        if freight_rate is not None:
            score += 15

        if total_capacity >= required_quantity:
            score += 10

        if plant.capacity_tons >= required_quantity:
            score += 5

        ranked_candidates.append((score, plant))

    if not ranked_candidates:
        return None

    ranked_candidates.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return ranked_candidates[0][1]


def find_available_inventory(
    db: Session,
    material_name: str,
    location: Optional[str] = None,
) -> Optional[models.InventoryItem]:

    query = (
        db.query(models.InventoryItem)
        .filter(models.InventoryItem.item_name == material_name)
    )

    if location:
        query = query.filter(
            models.InventoryItem.location == location
        )

    return query.first()


def count_available_wagons(db: Session) -> int:
    return (
        db.query(models.Wagon)
        .filter(models.Wagon.available.is_(True))
        .count()
    )


def find_freight_rate(
    db: Session,
    destination: str,
    origin: Optional[str] = None,
) -> Optional[models.FreightRate]:

    query = db.query(models.FreightRate)

    if origin:
        freight_rate = (
            query
            .filter(
                models.FreightRate.origin == origin,
                models.FreightRate.destination == destination,
            )
            .order_by(
                models.FreightRate.effective_from.desc()
            )
            .first()
        )

        if freight_rate:
            return freight_rate

    return (
        query
        .filter(
            models.FreightRate.destination == destination
        )
        .order_by(
            models.FreightRate.effective_from.desc()
        )
        .first()
    )


def calculate_required_wagons(
    quantity: int,
    capacity_per_wagon: int = 50,
) -> int:

    return ceil(quantity / capacity_per_wagon)


def calculate_estimated_cost(
    quantity: int,
    rate_per_ton: float,
) -> float:

    return quantity * rate_per_ton