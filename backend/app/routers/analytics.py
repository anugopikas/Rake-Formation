from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_db_session
from app.utils.optimizer_helpers import calculate_kpis

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/kpis", response_model=schemas.KPIResponse)
def get_analytics_kpis(db: Session = Depends(get_db_session)) -> schemas.KPIResponse:
    assignments = db.query(models.RakeAssignment).all()
    wagon_ids = {assignment.wagon_id for assignment in assignments}
    wagons = db.query(models.Wagon).filter(models.Wagon.id.in_(wagon_ids)).all() if wagon_ids else []
    capacities = {wagon.id: wagon.max_capacity_tons for wagon in wagons}
    return schemas.KPIResponse(**calculate_kpis(assignments, wagon_capacities=capacities))


@router.get("/rake-plans/timeseries")
def get_rake_plan_timeseries(db: Session = Depends(get_db_session)) -> list[dict]:
    plans = db.query(models.RakePlan).order_by(models.RakePlan.created_at).all()
    counts: dict[str, int] = defaultdict(int)
    for plan in plans:
        plan_date = plan.created_at.date().isoformat() if plan.created_at else date.today().isoformat()
        counts[plan_date] += 1
    return [
        {"date": day, "plans_generated": count}
        for day, count in sorted(counts.items())
    ]


@router.get("/wagons/utilization")
def get_wagon_utilization(db: Session = Depends(get_db_session)) -> list[dict]:
    wagons = db.query(models.Wagon).order_by(models.Wagon.wagon_number).all()
    assignments = db.query(models.RakeAssignment).all()
    assigned_tons: dict[int, float] = defaultdict(float)
    for assignment in assignments:
        assigned_tons[assignment.wagon_id] += float(assignment.quantity_tons or 0)

    results = []
    for wagon in wagons:
        quantity = assigned_tons[wagon.id]
        capacity = float(wagon.max_capacity_tons or 0)
        results.append({
            "wagon_id": wagon.id,
            "wagon_number": wagon.wagon_number,
            "wagon_type": wagon.wagon_type,
            "capacity_tons": capacity,
            "assigned_tons": quantity,
            "utilization_percent": min(100.0, quantity / capacity * 100) if capacity > 0 else 0.0,
        })
    return results
