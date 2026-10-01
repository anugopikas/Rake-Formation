from __future__ import annotations


class OptimizationService:
    def recommend_wagons(self, demand_tons: float) -> int:
        return max(1, int(demand_tons // 100) + 1)
