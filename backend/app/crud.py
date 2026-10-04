from sqlalchemy.orm import Session

from app import models, schemas


# ==========================================================
# Orders
# ==========================================================

def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    db_order = models.Order(**order_in.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_order(db: Session, order_id: int) -> models.Order | None:
    return (
        db.query(models.Order)
        .filter(models.Order.order_id == order_id)
        .first()
    )


def list_orders(db: Session, skip: int = 0, limit: int = 100) -> list[models.Order]:
    return (
        db.query(models.Order)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_order_status(
    db: Session,
    order_id: int,
    status: str,
) -> models.Order | None:
    order = get_order(db, order_id)

    if order:
        order.status = status
        db.commit()
        db.refresh(order)

    return order


# ==========================================================
# Inventory
# ==========================================================

def create_inventory_item(
    db: Session,
    item_in: schemas.InventoryItemCreate,
) -> models.InventoryItem:
    db_item = models.InventoryItem(**item_in.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def list_inventory_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[models.InventoryItem]:
    return (
        db.query(models.InventoryItem)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# Plants
# ==========================================================

def create_plant(
    db: Session,
    plant_in: schemas.PlantCreate,
) -> models.Plant:
    db_plant = models.Plant(**plant_in.model_dump())
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant


def list_plants(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[models.Plant]:
    return (
        db.query(models.Plant)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# Wagons
# ==========================================================

def create_wagon(
    db: Session,
    wagon_in: schemas.WagonCreate,
) -> models.Wagon:
    db_wagon = models.Wagon(**wagon_in.model_dump())
    db.add(db_wagon)
    db.commit()
    db.refresh(db_wagon)
    return db_wagon


def list_wagons(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[models.Wagon]:
    return (
        db.query(models.Wagon)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# Freight Rates
# ==========================================================

def create_freight_rate(
    db: Session,
    rate_in: schemas.FreightRateCreate,
) -> models.FreightRate:
    db_rate = models.FreightRate(**rate_in.model_dump())
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate


def list_freight_rates(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[models.FreightRate]:
    return (
        db.query(models.FreightRate)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# Railway Rules
# ==========================================================

def create_railway_rule(
    db: Session,
    rule_in: schemas.RailwayRuleCreate,
) -> models.RailwayRule:
    db_rule = models.RailwayRule(**rule_in.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def list_railway_rules(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[models.RailwayRule]:
    return (
        db.query(models.RailwayRule)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# Rake Plans
# ==========================================================

def create_rake_plan(
    db: Session,
    plan_in: schemas.RakePlanCreate,
) -> models.RakePlan:
    db_plan = models.RakePlan(**plan_in.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


def list_rake_plans(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[models.RakePlan]:
    return (
        db.query(models.RakePlan)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# Users
# ==========================================================

def create_user(
    db: Session,
    user_in: schemas.UserCreate,
) -> models.User:
    db_user = models.User(**user_in.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[models.User]:
    return (
        db.query(models.User)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# Approvals
# ==========================================================

def create_approval(
    db: Session,
    approval_in: schemas.ApprovalCreate,
) -> models.Approval:
    db_approval = models.Approval(**approval_in.model_dump())
    db.add(db_approval)
    db.commit()
    db.refresh(db_approval)
    return db_approval


def list_approvals(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    decision: str | None = None,
) -> list[models.Approval]:
    query = db.query(models.Approval)
    if decision:
        query = query.filter(models.Approval.decision.ilike(decision))
    return (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_approval_decision(
    db: Session,
    approval_id: int,
    decision: str,
    comments: str | None = None,
) -> models.Approval | None:
    approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if approval is None:
        return None
    approval.decision = decision
    if comments is not None:
        approval.comments = comments
    db.commit()
    db.refresh(approval)
    return approval


def get_rake_plan(db: Session, plan_id: int) -> models.RakePlan | None:
    return db.query(models.RakePlan).filter(models.RakePlan.id == plan_id).first()


def get_rake_plan_with_assignments(db: Session, plan_id: int) -> models.RakePlan | None:
    plan = db.query(models.RakePlan).filter(models.RakePlan.id == plan_id).first()
    if plan is not None:
        _ = plan.assignments
    return plan
