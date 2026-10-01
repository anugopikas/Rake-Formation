from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/railway-rules", tags=["railway-rules"])


@router.post("/", response_model=schemas.RailwayRule, status_code=status.HTTP_201_CREATED)
def create_railway_rule(rule: schemas.RailwayRuleCreate, db: Session = Depends(get_db_session)) -> schemas.RailwayRule:
    return crud.create_railway_rule(db=db, rule_in=rule)


@router.get("/", response_model=list[schemas.RailwayRule])
def list_railway_rules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.RailwayRule]:
    return crud.list_railway_rules(db=db, skip=skip, limit=limit)
