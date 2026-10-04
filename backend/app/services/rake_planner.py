from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app import crud, models
from app.utils.optimizer_helpers import validate_assignments


class RakePlannerService:
    def __init__(self, db: Session):
        self.db = db

    def generate_optimal_plan(
        self,
        order_ids: list[int],
        planning_horizon_days: int = 7,
        optimization_mode: str = "balanced",
    ) -> models.RakePlan:
        if not order_ids:
            raise ValueError("At least one order_id is required.")
        if planning_horizon_days < 1:
            raise ValueError("planning_horizon_days must be at least 1.")

        requested_ids = list(dict.fromkeys(order_ids))
        orders = self.db.query(models.Order).filter(models.Order.order_id.in_(requested_ids)).all()
        orders_by_id = {order.order_id: order for order in orders}
        missing_ids = [order_id for order_id in requested_ids if order_id not in orders_by_id]
        if missing_ids:
            raise ValueError(f"Orders not found: {missing_ids}")

        priority_rank = {"urgent": 0, "critical": 0, "high": 1, "medium": 2, "normal": 2, "low": 3}
        orders.sort(key=lambda order: (priority_rank.get(order.priority.casefold(), 2), order.delivery_date))

        wagons = (
            self.db.query(models.Wagon)
            .filter(models.Wagon.available.is_(True), models.Wagon.max_capacity_tons > 0)
            .all()
        )
        plants = self.db.query(models.Plant).filter(models.Plant.active.is_(True)).all()
        freight_rates = self.db.query(models.FreightRate).all()
        available_wagons = list(wagons)

        if not available_wagons:
            raise ValueError("No available wagons can be assigned.")
        if not plants:
            raise ValueError("No active plants can be assigned.")

        now = datetime.utcnow()
        staged_assignments: list[dict] = []
        for order_index, order in enumerate(orders):
            quantity_remaining = float(order.quantity)
            matching_plants = [plant for plant in plants if plant.capacity_tons >= quantity_remaining]
            if not matching_plants:
                raise ValueError(f"No active plant has enough capacity for order {order.order_id}.")

            plant_costs = []
            for plant in matching_plants:
                applicable_rates = [
                    rate for rate in freight_rates
                    if rate.destination.casefold() == order.destination.casefold()
                    and rate.origin.casefold() in {plant.region.casefold(), plant.plant_name.casefold()}
                ]
                rate = min(applicable_rates, key=lambda item: item.rate_per_ton, default=None)
                plant_costs.append((plant, rate))

            if optimization_mode.casefold() == "cost":
                plant, rate = min(
                    plant_costs,
                    key=lambda pair: pair[1].rate_per_ton if pair[1] is not None else float("inf"),
                )
            else:
                plant, rate = min(plant_costs, key=lambda pair: pair[0].capacity_tons)

            departure = now + timedelta(days=min(order_index, planning_horizon_days - 1))
            arrival = departure + timedelta(hours=6)
            order_rate = rate.rate_per_ton if rate is not None else 0.0

            while quantity_remaining > 0:
                fitting_wagons = [
                    wagon for wagon in available_wagons
                    if wagon.max_capacity_tons > 0
                ]
                if not fitting_wagons:
                    raise ValueError(f"Insufficient available wagon capacity for order {order.order_id}.")
                wagon = min(
                    fitting_wagons,
                    key=lambda item: (max(0.0, item.max_capacity_tons - quantity_remaining), item.max_capacity_tons),
                )
                assigned_quantity = min(quantity_remaining, float(wagon.max_capacity_tons))
                staged_assignments.append({
                    "order_id": order.order_id,
                    "wagon_id": wagon.id,
                    "plant_id": plant.id,
                    "origin": plant.region,
                    "destination": order.destination,
                    "departure_time": departure,
                    "arrival_time": arrival,
                    "quantity_tons": assigned_quantity,
                    "estimated_cost": assigned_quantity * order_rate,
                    "status": "planned",
                })
                quantity_remaining -= assigned_quantity
                available_wagons.remove(wagon)

        errors = validate_assignments(staged_assignments, orders=orders, wagons=wagons, plants=plants)
        if errors:
            raise ValueError("Generated assignments are invalid: " + " ".join(errors))

        plan = models.RakePlan(
            plan_code=f"RP-{now:%Y%m%d%H%M%S}-{uuid4().hex[:6].upper()}",
            plan_name=f"Generated rake plan {now:%Y-%m-%d %H:%M}",
            objective=f"{optimization_mode} allocation for {len(orders)} orders",
            status="planned",
        )
        try:
            self.db.add(plan)
            self.db.flush()
            assignments = [
                models.RakeAssignment(rake_plan_id=plan.id, **assignment)
                for assignment in staged_assignments
            ]
            self.db.add_all(assignments)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return crud.get_rake_plan_with_assignments(self.db, plan.id)
