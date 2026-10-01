from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/plants", tags=["plants"])


@router.post("/", response_model=schemas.Plant, status_code=status.HTTP_201_CREATED)
def create_plant(plant: schemas.PlantCreate, db: Session = Depends(get_db_session)) -> schemas.Plant:
    return crud.create_plant(db=db, plant_in=plant)


@router.get("/", response_model=list[schemas.Plant])
def list_plants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.Plant]:
    return crud.list_plants(db=db, skip=skip, limit=limit)
