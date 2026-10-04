from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.post("/", response_model=schemas.Approval, status_code=status.HTTP_201_CREATED)
def create_approval(approval: schemas.ApprovalCreate, db: Session = Depends(get_db_session)) -> schemas.Approval:
    return crud.create_approval(db=db, approval_in=approval)


@router.get("/", response_model=list[schemas.Approval])
def list_approvals(skip: int = 0, limit: int = 100, decision: str | None = None, db: Session = Depends(get_db_session)) -> list[schemas.Approval]:
    return crud.list_approvals(db=db, skip=skip, limit=limit, decision=decision)


@router.patch("/{approval_id}", response_model=schemas.Approval)
def update_approval(approval_id: int, update: schemas.ApprovalDecisionUpdate, db: Session = Depends(get_db_session)) -> schemas.Approval:
    approval = crud.update_approval_decision(
        db=db,
        approval_id=approval_id,
        decision=update.decision,
        comments=update.comments,
    )
    if approval is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found")
    return approval
