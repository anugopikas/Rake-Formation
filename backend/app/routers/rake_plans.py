from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/rake-plans", tags=["rake-plans"])


@router.post("/", response_model=schemas.RakePlan, status_code=status.HTTP_201_CREATED)
def create_rake_plan(plan: schemas.RakePlanCreate, db: Session = Depends(get_db_session)) -> schemas.RakePlan:
    return crud.create_rake_plan(db=db, plan_in=plan)


@router.get("/", response_model=list[schemas.RakePlan])
def list_rake_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.RakePlan]:
    return crud.list_rake_plans(db=db, skip=skip, limit=limit)
