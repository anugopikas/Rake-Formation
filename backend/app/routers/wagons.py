from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/wagons", tags=["wagons"])


@router.post("/", response_model=schemas.Wagon, status_code=status.HTTP_201_CREATED)
def create_wagon(wagon: schemas.WagonCreate, db: Session = Depends(get_db_session)) -> schemas.Wagon:
    return crud.create_wagon(db=db, wagon_in=wagon)


@router.get("/", response_model=list[schemas.Wagon])
def list_wagons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.Wagon]:
    return crud.list_wagons(db=db, skip=skip, limit=limit)
