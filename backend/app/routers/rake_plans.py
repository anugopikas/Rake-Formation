from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db_session
from app.services.rake_planner import RakePlannerService
from app.utils.optimizer_helpers import calculate_kpis

router = APIRouter(prefix="/rake-plans", tags=["rake-plans"])


@router.post("/", response_model=schemas.RakePlan, status_code=status.HTTP_201_CREATED)
def create_rake_plan(plan: schemas.RakePlanCreate, db: Session = Depends(get_db_session)) -> schemas.RakePlan:
    return crud.create_rake_plan(db=db, plan_in=plan)


@router.get("/", response_model=list[schemas.RakePlan])
def list_rake_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)) -> list[schemas.RakePlan]:
    return crud.list_rake_plans(db=db, skip=skip, limit=limit)


@router.post("/generate", response_model=schemas.RakePlanWithAssignments, status_code=status.HTTP_201_CREATED)
def generate_rake_plan(
    request: schemas.RakePlanGenerateRequest,
    db: Session = Depends(get_db_session),
) -> schemas.RakePlanWithAssignments:
    try:
        return RakePlannerService(db).generate_optimal_plan(
            order_ids=request.order_ids,
            planning_horizon_days=request.planning_horizon_days,
            optimization_mode=request.optimization_mode,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("/{plan_id}/kpis", response_model=schemas.KPIResponse)
def get_rake_plan_kpis(plan_id: int, db: Session = Depends(get_db_session)) -> schemas.KPIResponse:
    plan = crud.get_rake_plan_with_assignments(db=db, plan_id=plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rake plan not found")

    wagon_ids = {assignment.wagon_id for assignment in plan.assignments}
    wagons = db.query(models.Wagon).filter(models.Wagon.id.in_(wagon_ids)).all() if wagon_ids else []
    capacities = {wagon.id: wagon.max_capacity_tons for wagon in wagons}
    return schemas.KPIResponse(**calculate_kpis(plan.assignments, plan.id, capacities))
