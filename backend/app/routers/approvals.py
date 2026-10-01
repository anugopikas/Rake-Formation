from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.post("/", response_model=schemas.Approval, status_code=status.HTTP_201_CREATED)
def create_approval(approval: schemas.ApprovalCreate, db: Session = Depends(get_db_session)) -> schemas.Approval:
    return crud.create_approval(db=db, approval_in=approval)


@router.get("/", response_model=list[schemas.Approval])
def list_approvals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.Approval]:
    return crud.list_approvals(db=db, skip=skip, limit=limit)
