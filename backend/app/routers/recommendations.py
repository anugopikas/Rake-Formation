from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.planner import generate_recommendation
from app.dependencies import get_db_session
from app import schemas
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(BaseModel):
    order_id: int


@router.post("/", response_model=schemas.RecommendationResponse, status_code=status.HTTP_200_OK)
def create_recommendation(
    payload: RecommendationRequest,
    db: Session = Depends(get_db_session),
) -> schemas.RecommendationResponse:
    try:
        result = generate_recommendation(order_id=payload.order_id, db=db)
    except ValueError as exc:
        if "Order not found" in str(exc):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found") from exc
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return schemas.RecommendationResponse(**result)


@router.post("/generate/{order_id}", status_code=status.HTTP_200_OK)
def generate_recommendation_endpoint(
    order_id: int,
    db: Session = Depends(get_db_session),
) -> dict:
    try:
        result = generate_recommendation(order_id=order_id, db=db)
    except ValueError as exc:
        if "Order not found" in str(exc):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found") from exc
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return result


@router.post("/plant", status_code=status.HTTP_200_OK)
def recommend_plant(
    payload: RecommendationRequest,
    db: Session = Depends(get_db_session),
) -> dict:
    try:
        return RecommendationEngine(db).recommend_plant(payload.order_id)
    except ValueError as exc:
        if "Order not found" in str(exc):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found") from exc
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/wagons", status_code=status.HTTP_200_OK)
def recommend_wagons(
    payload: RecommendationRequest,
    db: Session = Depends(get_db_session),
) -> dict:
    try:
        return RecommendationEngine(db).recommend_wagons(payload.order_id)
    except ValueError as exc:
        if "Order not found" in str(exc):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found") from exc
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
