from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/freight-rates", tags=["freight-rates"])


@router.post("/", response_model=schemas.FreightRate, status_code=status.HTTP_201_CREATED)
def create_freight_rate(rate: schemas.FreightRateCreate, db: Session = Depends(get_db_session)) -> schemas.FreightRate:
    return crud.create_freight_rate(db=db, rate_in=rate)


@router.get("/", response_model=list[schemas.FreightRate])
def list_freight_rates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.FreightRate]:
    return crud.list_freight_rates(db=db, skip=skip, limit=limit)
