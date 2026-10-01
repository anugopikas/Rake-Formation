from typing import Any

from sqlalchemy.orm import Session

from app import models
from app.ai.optimizer import (
    calculate_estimated_cost,
    calculate_required_wagons,
    count_available_wagons,
    find_available_inventory,
    find_freight_rate,
    select_best_plant,
)
from app.ai.rules import (
    get_estimated_delivery_time,
    validate_max_wagons,
    validate_railway_rules,
)


def generate_recommendation(
    order_id: int,
    db: Session,
) -> dict[str, Any]:

    # ============================================================
    # 1. GET ORDER
    # ============================================================

    order = (
        db.query(models.Order)
        .filter(models.Order.order_id == order_id)
        .first()
    )

    if order is None:
        raise ValueError("Order not found")

    # ============================================================
    # 2. BASIC VALIDATION
    # ============================================================

    if order.quantity <= 0:
        raise ValueError("Invalid quantity")

    if not order.material_name:
        raise ValueError("Invalid material")

    if not order.destination:
        raise ValueError("Invalid destination")

    if not order.delivery_date:
        raise ValueError("Invalid delivery date")

    if not order.priority:
        raise ValueError("Invalid priority")

    # ============================================================
    # 3. FIND PLANT
    # ============================================================
    #
    # First use the existing optimizer.
    #
    # IMPORTANT:
    # select_best_plant() currently requires freight information.
    # Therefore, when freight is missing, it can return None.
    #
    # In that case we perform a fallback search using only:
    #   - active plant
    #   - plant capacity
    #   - inventory
    #
    # This allows the planner to reach the freight-rate check and
    # correctly return REVIEW REQUIRED.
    # ============================================================

    plant = select_best_plant(
        db,
        order.material_name,
        order.quantity,
        order.destination,
    )

    if plant is None:

        fallback_plants = (
            db.query(models.Plant)
            .filter(models.Plant.active.is_(True))
            .all()
        )

        for candidate in fallback_plants:

            # Plant capacity
            if candidate.capacity_tons < order.quantity:
                continue

            # Inventory
            inventory = find_available_inventory(
                db,
                order.material_name,
                candidate.region,
            )

            if inventory is None:
                continue

            if inventory.available_units < order.quantity:
                continue

            # Suitable plant found.
            plant = candidate
            break

    # ============================================================
    # 4. NO SUITABLE PLANT
    # ============================================================

    if plant is None:

        reason = (
            "No feasible plant with sufficient "
            "inventory and capacity was found."
        )

        return {
            "order_id": order.order_id,
            "recommended_plant": None,
            "origin": None,
            "destination": order.destination,
            "material": order.material_name,
            "quantity": order.quantity,
            "allocated_wagons": 0,
            "estimated_cost": 0.0,
            "estimated_time": "Requires review",
            "decision": "REJECTED",
            "reason": reason,
            "reasons": [
                reason,
            ],
            "warnings": [],
            "constraints_checked": [
                "Plant Capacity",
                "Inventory",
            ],
        }

    # ============================================================
    # 5. INVENTORY CHECK
    # ============================================================

    inventory_item = find_available_inventory(
        db,
        order.material_name,
        plant.region,
    )

    if (
        inventory_item is None
        or inventory_item.available_units < order.quantity
    ):

        reason = (
            "Insufficient inventory at the selected plant."
        )

        return {
            "order_id": order.order_id,
            "recommended_plant": plant.plant_name,
            "origin": plant.region,
            "destination": order.destination,
            "material": order.material_name,
            "quantity": order.quantity,
            "allocated_wagons": 0,
            "estimated_cost": 0.0,
            "estimated_time": "Requires review",
            "decision": "REJECTED",
            "reason": reason,
            "reasons": [
                reason,
                "Available inventory is less than "
                "the requested quantity.",
            ],
            "warnings": [
                "Inventory constraint failed.",
            ],
            "constraints_checked": [
                "Plant Capacity",
                "Inventory",
            ],
        }

    # ============================================================
    # FREIGHT RATE CHECK
    # ============================================================
    #
    # If plant + inventory are available but the route has
    # no freight rate, the recommendation requires manual review.
    #
    # This check is intentionally done BEFORE wagon rejection
    # because missing freight information is a REVIEW condition,
    # not an automatic rejection.
    # ============================================================

    freight_rate = find_freight_rate(
        db,
        destination=order.destination,
        origin=plant.region,
    )

    if freight_rate is None:

        required_wagons = calculate_required_wagons(
            order.quantity
        )

        reason = (
            "No valid freight rate was found for the "
            "selected route; manual review is required."
        )

        return {
            "order_id": order.order_id,
            "recommended_plant": plant.plant_name,
            "origin": plant.region,
            "destination": order.destination,
            "material": order.material_name,
            "quantity": order.quantity,
            "allocated_wagons": required_wagons,
            "estimated_cost": 0.0,
            "estimated_time": "Requires review",
            "decision": "REVIEW REQUIRED",
            "reason": reason,
            "reasons": [
                "Sufficient inventory is available "
                "for the requested quantity.",
                "Plant capacity is sufficient.",
                "No valid freight rate was found for "
                "the selected route; manual review "
                "is required.",
            ],
            "warnings": [
                "Freight rate information is missing.",
                "Manual freight-rate review is required.",
            ],
            "constraints_checked": [
                "Plant Capacity",
                "Inventory",
                "Freight Rate",
            ],
        }
    # ============================================================
    # 6. WAGON CALCULATION
    # ============================================================

    available_wagons = (
        db.query(models.Wagon)
        .filter(models.Wagon.available.is_(True))
        .all()
    )

    total_available_capacity = sum(
        wagon.max_capacity_tons
        for wagon in available_wagons
    )

    required_wagons = calculate_required_wagons(
        order.quantity
    )

    # ============================================================
    # 7. TOTAL WAGON CAPACITY CHECK
    # ============================================================

    if total_available_capacity < order.quantity:

        reason = (
            "Insufficient available wagon capacity."
        )

        return {
            "order_id": order.order_id,
            "recommended_plant": plant.plant_name,
            "origin": plant.region,
            "destination": order.destination,
            "material": order.material_name,
            "quantity": order.quantity,
            "allocated_wagons": 0,
            "estimated_cost": 0.0,
            "estimated_time": "Requires review",
            "decision": "REJECTED",
            "reason": reason,
            "reasons": [
                reason,
            ],
            "warnings": [
                "Available wagon capacity is insufficient.",
            ],
            "constraints_checked": [
                "Plant Capacity",
                "Inventory",
                "Wagon Capacity",
            ],
        }

    # ============================================================
    # 8. NUMBER OF WAGONS CHECK
    # ============================================================

    available_wagon_count = count_available_wagons(db)

    if available_wagon_count < required_wagons:

        reason = (
            "Insufficient available wagons "
            "for the required formation."
        )

        return {
            "order_id": order.order_id,
            "recommended_plant": plant.plant_name,
            "origin": plant.region,
            "destination": order.destination,
            "material": order.material_name,
            "quantity": order.quantity,
            "allocated_wagons": available_wagon_count,
            "estimated_cost": 0.0,
            "estimated_time": "Requires review",
            "decision": "REJECTED",
            "reason": reason,
            "reasons": [
                reason,
            ],
            "warnings": [
                "Required number of wagons is not available.",
            ],
            "constraints_checked": [
                "Plant Capacity",
                "Inventory",
                "Wagon Capacity",
            ],
        }

    # ============================================================
    # 9. MAXIMUM WAGON RULE
    # ============================================================

    if not validate_max_wagons(required_wagons):

        reason = (
            "Selected formation exceeds the "
            "maximum allowed wagon count."
        )

        return {
            "order_id": order.order_id,
            "recommended_plant": plant.plant_name,
            "origin": plant.region,
            "destination": order.destination,
            "material": order.material_name,
            "quantity": order.quantity,
            "allocated_wagons": required_wagons,
            "estimated_cost": 0.0,
            "estimated_time": "Requires review",
            "decision": "REJECTED",
            "reason": reason,
            "reasons": [
                reason,
            ],
            "warnings": [
                "Maximum wagon formation rule failed.",
            ],
            "constraints_checked": [
                "Plant Capacity",
                "Inventory",
                "Wagon Capacity",
                "Railway Rules",
            ],
        }

    # ============================================================
    # 10. RAILWAY RULES
    # ============================================================

    rule_ok, rule_error = validate_railway_rules(
        required_wagons,
        order.quantity,
        order.priority,
    )

    if not rule_ok:

        reason = rule_error

        return {
            "order_id": order.order_id,
            "recommended_plant": plant.plant_name,
            "origin": plant.region,
            "destination": order.destination,
            "material": order.material_name,
            "quantity": order.quantity,
            "allocated_wagons": required_wagons,
            "estimated_cost": 0.0,
            "estimated_time": "Requires review",
            "decision": "REJECTED",
            "reason": reason,
            "reasons": [
                reason,
            ],
            "warnings": [
                "Railway rule validation failed.",
            ],
            "constraints_checked": [
                "Plant Capacity",
                "Inventory",
                "Wagon Capacity",
                "Railway Rules",
            ],
        }



    # ============================================================
    # 12. ESTIMATED COST
    # ============================================================

    estimated_cost = calculate_estimated_cost(
        order.quantity,
        freight_rate.rate_per_ton,
    )

    # ============================================================
    # 13. ESTIMATED DELIVERY TIME
    # ============================================================

    estimated_time = get_estimated_delivery_time(
        plant.region,
        order.destination,
    )

    # ============================================================
    # 14. APPROVED RECOMMENDATION
    # ============================================================

    reason = (
        f"{plant.plant_name} has sufficient inventory "
        f"for {order.quantity} tons of "
        f"{order.material_name}. "
        f"{required_wagons} wagons provide "
        f"{required_wagons * 50} tons of capacity. "
        f"The route to {order.destination} has a valid "
        f"freight rate and satisfies the active "
        f"railway rules."
    )

    return {
        "order_id": order.order_id,
        "recommended_plant": plant.plant_name,
        "origin": plant.region,
        "destination": order.destination,
        "material": order.material_name,
        "quantity": order.quantity,
        "allocated_wagons": required_wagons,
        "estimated_cost": round(estimated_cost, 2),
        "estimated_time": estimated_time,
        "decision": "APPROVED",
        "reason": reason,
        "reasons": [
            "Sufficient inventory is available "
            "for the requested quantity.",
            "Plant capacity is sufficient.",
            "Available wagons can transport "
            "the required quantity.",
            "A valid freight rate exists for the route.",
            "Active railway rules are satisfied.",
        ],
        "warnings": [],
        "constraints_checked": [
            "Plant Capacity",
            "Inventory",
            "Wagon Capacity",
            "Railway Rules",
            "Freight Rate",
        ],
    }