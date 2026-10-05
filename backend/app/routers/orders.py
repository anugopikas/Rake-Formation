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


@router.patch(
    "/{order_id}",
    response_model=schemas.Order
)
def update_order(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db_session)
):
    order = crud.update_order(db=db, order_id=order_id, order_update=order_update)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db_session)
) -> None:
    deleted = crud.delete_order(db=db, order_id=order_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )