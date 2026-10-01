from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.dependencies import get_db_session

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)


# ------------------------------------------------
# CREATE ORDER
# ------------------------------------------------

@router.post(
    "/",
    response_model=schemas.Order,
    status_code=status.HTTP_201_CREATED
)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db_session)
):
    try:
        created_order = crud.create_order(
            db=db,
            order_in=order
        )
        return created_order

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )


# ------------------------------------------------
# GET ALL ORDERS
# ------------------------------------------------

@router.get(
    "/",
    response_model=list[schemas.Order]
)
def list_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    return crud.list_orders(
        db=db,
        skip=skip,
        limit=limit
    )


# ------------------------------------------------
# GET ORDER BY ID
# ------------------------------------------------

@router.get(
    "/{order_id}",
    response_model=schemas.Order
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db_session)
):
    order = crud.get_order(
        db=db,
        order_id=order_id
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order