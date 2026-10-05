from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.dependencies import get_db_session
from app.services.forecast_service import ForecastService

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/demand")
def get_demand_forecast(
    db: Session = Depends(get_db_session),
) -> dict[str, list[dict[str, str | int | float]]]:
    demand_by_date: dict[str, int] = defaultdict(int)
    orders = db.query(models.Order).order_by(models.Order.delivery_date).all()

    for order in orders:
        if order.delivery_date and order.quantity > 0:
            demand_by_date[order.delivery_date.isoformat()] += order.quantity

    forecast_service = ForecastService()
    forecast = [
        {
            "date": forecast_date,
            "actual": quantity,
            "predicted": forecast_service.generate_forecast(quantity)[
                "forecasted_demand_tons"
            ],
        }
        for forecast_date, quantity in sorted(demand_by_date.items())
    ]
    return {"forecast": forecast}
