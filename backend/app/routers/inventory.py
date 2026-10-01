from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.post("/", response_model=schemas.InventoryItem, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: schemas.InventoryItemCreate, db: Session = Depends(get_db_session)) -> schemas.InventoryItem:
    return crud.create_inventory_item(db=db, item_in=item)


@router.get("/", response_model=list[schemas.InventoryItem])
def list_inventory_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.InventoryItem]:
    return crud.list_inventory_items(db=db, skip=skip, limit=limit)
