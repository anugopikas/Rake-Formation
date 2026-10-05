from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.dependencies import get_db_session

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _alert(
    severity: str,
    title: str,
    message: str,
    time: str,
    action_label: str,
    action_url: str,
) -> dict[str, str]:
    return {
        "severity": severity,
        "title": title,
        "message": message,
        "time": time,
        "action_label": action_label,
        "action_url": action_url,
    }


@router.get("/")
def get_operational_alerts(
    db: Session = Depends(get_db_session),
) -> dict[str, list[dict[str, str]]]:
    alerts: list[dict[str, str]] = []

    inventory_items = db.query(models.InventoryItem).order_by(
        models.InventoryItem.available_units
    ).all()
    for item in inventory_items:
        available = int(item.available_units or 0)
        if available < 100:
            alerts.append(
                _alert(
                    "CRITICAL",
                    "Low inventory detected",
                    f"{item.item_name} has only {available} units available.",
                    "Current",
                    "View Inventory",
                    "/inventory",
                )
            )
        elif available < 250:
            alerts.append(
                _alert(
                    "HIGH",
                    "Low inventory detected",
                    f"{item.item_name} is below the 250-unit review threshold ({available} available).",
                    "Current",
                    "View Inventory",
                    "/inventory",
                )
            )

    plans = db.query(models.RakePlan).all()
    assignments = db.query(models.RakeAssignment).all()
    wagons = db.query(models.Wagon).all()
    wagon_capacity = {wagon.id: float(wagon.max_capacity_tons or 0) for wagon in wagons}
    plan_by_id = {plan.id: plan for plan in plans}
    plan_loads: dict[int, float] = {}
    plan_wagons: dict[int, set[int]] = {}
    assigned_order_ids: set[int] = set()

    for assignment in assignments:
        plan_loads[assignment.rake_plan_id] = (
            plan_loads.get(assignment.rake_plan_id, 0.0)
            + float(assignment.quantity_tons or 0)
        )
        plan_wagons.setdefault(assignment.rake_plan_id, set()).add(assignment.wagon_id)
        assigned_order_ids.add(assignment.order_id)

    for plan_id, wagon_ids in plan_wagons.items():
        capacity = sum(wagon_capacity.get(wagon_id, 0.0) for wagon_id in wagon_ids)
        if capacity <= 0:
            continue
        utilization = min(100.0, plan_loads[plan_id] / capacity * 100)
        if utilization >= 90:
            plan = plan_by_id.get(plan_id)
            plan_code = plan.plan_code if plan else f"Plan {plan_id}"
            alerts.append(
                _alert(
                    "WARNING",
                    "Rake capacity nearing limit",
                    f"Rake {plan_code} is currently at {utilization:.0f}% capacity.",
                    "Current",
                    "View Rake",
                    "/rake-plans",
                )
            )

    today = date.today()
    orders = db.query(models.Order).order_by(models.Order.delivery_date).all()
    for order in orders:
        status = str(order.status or "").strip().lower()
        if status in {"completed", "cancelled", "rejected"} or not order.delivery_date:
            continue
        days_until_delivery = (order.delivery_date - today).days
        if days_until_delivery < 0:
            alerts.append(
                _alert(
                    "CRITICAL",
                    "Order fulfillment risk",
                    f"Order for {order.customer_name} is {abs(days_until_delivery)} day(s) past its delivery date.",
                    f"{abs(days_until_delivery)} day(s) overdue",
                    "View Order",
                    "/orders",
                )
            )
        elif days_until_delivery <= 3:
            alerts.append(
                _alert(
                    "HIGH",
                    "Order fulfillment risk",
                    f"Order for {order.customer_name} is due within {days_until_delivery} day(s).",
                    f"Due in {days_until_delivery} day(s)",
                    "View Order",
                    "/orders",
                )
            )
        elif order.order_id not in assigned_order_ids:
            alerts.append(
                _alert(
                    "INFO",
                    "Order needs a rake recommendation",
                    f"Order for {order.customer_name} has no rake assignment yet.",
                    "Awaiting planning",
                    "View Order",
                    "/orders",
                )
            )

    severity_order = {"CRITICAL": 0, "HIGH": 1, "WARNING": 2, "INFO": 3}
    alerts.sort(key=lambda item: severity_order.get(item["severity"], 4))
    return {"alerts": alerts[:10]}
