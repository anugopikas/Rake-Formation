from __future__ import annotations


class RecommendationService:
    def recommend_route(self, origin: str, destination: str) -> str:
        return f"{origin} -> {destination}"
