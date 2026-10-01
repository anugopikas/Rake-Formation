from __future__ import annotations


class ForecastService:
    def generate_forecast(self, demand_tons: float) -> dict[str, float]:
        return {"forecasted_demand_tons": round(demand_tons * 1.1, 2)}
