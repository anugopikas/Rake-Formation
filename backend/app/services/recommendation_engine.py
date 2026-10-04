from __future__ import annotations

from sqlalchemy.orm import Session

from app import models


class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db

    def _get_order(self, order_id: int) -> models.Order:
        order = self.db.query(models.Order).filter(models.Order.order_id == order_id).first()
        if order is None:
            raise ValueError("Order not found")
        return order

    def recommend_plant(self, order_id: int) -> dict:
        order = self._get_order(order_id)
        plants = self.db.query(models.Plant).filter(models.Plant.active.is_(True)).all()
        inventory = self.db.query(models.InventoryItem).all()
        freight_rates = self.db.query(models.FreightRate).all()
        candidates = []

        for plant in plants:
            if plant.capacity_tons < order.quantity:
                continue
            matching_inventory = [
                item for item in inventory
                if item.item_name.casefold() == order.material_name.casefold()
                and item.location.casefold() in {plant.region.casefold(), plant.plant_name.casefold()}
            ]
            available_units = sum(item.available_units for item in matching_inventory)
            rates = [
                rate for rate in freight_rates
                if rate.destination.casefold() == order.destination.casefold()
                and rate.origin.casefold() in {plant.region.casefold(), plant.plant_name.casefold()}
            ]
            rate = min(rates, key=lambda item: item.rate_per_ton, default=None)
            inventory_score = min(1.0, available_units / max(float(order.quantity), 1.0))
            capacity_score = min(1.0, float(order.quantity) / plant.capacity_tons)
            cost_score = 1.0 / (1.0 + rate.rate_per_ton / 1000.0) if rate else 0.5
            score = (inventory_score * 0.5) + ((1.0 - capacity_score) * 0.2) + (cost_score * 0.3)
            candidates.append({
                "plant_id": plant.id,
                "plant_name": plant.plant_name,
                "origin": plant.region,
                "available_inventory": available_units,
                "inventory_sufficient": available_units >= order.quantity,
                "capacity_tons": plant.capacity_tons,
                "estimated_cost": float(order.quantity * rate.rate_per_ton) if rate else None,
                "score": round(score, 4),
            })

        candidates.sort(key=lambda candidate: candidate["score"], reverse=True)
        best = candidates[0] if candidates else None
        return {
            "order_id": order.order_id,
            "recommended_plant": best["plant_name"] if best else None,
            "origin": best["origin"] if best else None,
            "destination": order.destination,
            "score": best["score"] if best else 0.0,
            "estimated_cost": best["estimated_cost"] if best else None,
            "candidates": candidates,
        }

    def recommend_wagons(self, order_id: int) -> dict:
        order = self._get_order(order_id)
        available_wagons = (
            self.db.query(models.Wagon)
            .filter(models.Wagon.available.is_(True), models.Wagon.max_capacity_tons > 0)
            .all()
        )
        remaining = float(order.quantity)
        selected = []

        while remaining > 0 and available_wagons:
            fitting = [wagon for wagon in available_wagons if wagon.max_capacity_tons >= remaining]
            wagon = min(fitting, key=lambda item: item.max_capacity_tons) if fitting else max(
                available_wagons,
                key=lambda item: item.max_capacity_tons,
            )
            assigned = min(remaining, float(wagon.max_capacity_tons))
            selected.append({
                "wagon_id": wagon.id,
                "wagon_number": wagon.wagon_number,
                "wagon_type": wagon.wagon_type,
                "capacity_tons": wagon.max_capacity_tons,
                "assigned_tons": assigned,
            })
            remaining -= assigned
            available_wagons.remove(wagon)

        allocated = float(order.quantity) - remaining
        return {
            "order_id": order.order_id,
            "required_tons": float(order.quantity),
            "allocated_tons": allocated,
            "unallocated_tons": max(0.0, remaining),
            "capacity_sufficient": remaining <= 0,
            "recommended_wagons": selected,
        }
