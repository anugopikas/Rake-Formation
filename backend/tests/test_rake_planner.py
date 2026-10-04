from datetime import date, datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base
from app.schemas import RakePlanWithAssignments
from app.services.recommendation_engine import RecommendationEngine
from app.services.rake_planner import RakePlannerService
from app.utils.optimizer_helpers import calculate_kpis, validate_assignments


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def add_order(db_session, order_id: int, quantity: int, priority: str = "High"):
    order = models.Order(
        order_id=order_id,
        customer_name=f"Customer {order_id}",
        material_name="Steel",
        grade="A",
        quantity=quantity,
        destination="Chennai",
        priority=priority,
        delivery_date=date(2026, 12, 1),
        status="Pending",
    )
    db_session.add(order)


def test_generate_optimal_plan_persists_assignments(db_session):
    db_session.add(models.Plant(
        plant_code="PL-001",
        plant_name="Salem Steel Plant",
        region="Salem",
        capacity_tons=500,
        active=True,
    ))
    db_session.add_all([
        models.Wagon(wagon_number="WG-001", wagon_type="Open", max_capacity_tons=60, available=True),
        models.Wagon(wagon_number="WG-002", wagon_type="Open", max_capacity_tons=80, available=True),
    ])
    db_session.add(models.FreightRate(
        route_code="RT-001",
        origin="Salem",
        destination="Chennai",
        rate_per_ton=12.5,
        effective_from=datetime(2026, 1, 1),
    ))
    add_order(db_session, 1, 50)
    add_order(db_session, 2, 70, "Medium")
    db_session.commit()

    plan = RakePlannerService(db_session).generate_optimal_plan([1, 2], 3, "cost")

    assert plan.status == "planned"
    assert len(plan.assignments) == 2
    assert {assignment.order_id for assignment in plan.assignments} == {1, 2}
    assert sum(assignment.estimated_cost for assignment in plan.assignments) == 1500
    assert len(RakePlanWithAssignments.model_validate(plan).assignments) == 2


def test_generate_optimal_plan_does_not_persist_when_capacity_is_insufficient(db_session):
    db_session.add(models.Plant(
        plant_code="PL-002",
        plant_name="Salem Steel Plant",
        region="Salem",
        capacity_tons=500,
        active=True,
    ))
    db_session.add(models.Wagon(
        wagon_number="WG-003",
        wagon_type="Open",
        max_capacity_tons=40,
        available=True,
    ))
    add_order(db_session, 3, 50)
    db_session.commit()

    with pytest.raises(ValueError, match="Insufficient available wagon capacity"):
        RakePlannerService(db_session).generate_optimal_plan([3])

    assert db_session.query(models.RakePlan).count() == 0
    assert db_session.query(models.RakeAssignment).count() == 0


def test_recommendations_and_kpi_helpers(db_session):
    plant = models.Plant(
        plant_code="PL-003",
        plant_name="Salem Steel Plant",
        region="Salem",
        capacity_tons=500,
        active=True,
    )
    wagons = [
        models.Wagon(wagon_number="WG-004", wagon_type="Open", max_capacity_tons=50, available=True),
        models.Wagon(wagon_number="WG-005", wagon_type="Open", max_capacity_tons=50, available=True),
    ]
    db_session.add_all([
        plant,
        *wagons,
        models.InventoryItem(
            item_code="INV-003",
            item_name="Steel",
            category="Raw Material",
            available_units=100,
            location="Salem",
        ),
        models.FreightRate(
            route_code="RT-003",
            origin="Salem",
            destination="Chennai",
            rate_per_ton=10,
            effective_from=datetime(2026, 1, 1),
        ),
    ])
    add_order(db_session, 4, 90)
    db_session.commit()

    engine = RecommendationEngine(db_session)
    plant_recommendation = engine.recommend_plant(4)
    wagon_recommendation = engine.recommend_wagons(4)

    assert plant_recommendation["recommended_plant"] == "Salem Steel Plant"
    assert plant_recommendation["estimated_cost"] == 900
    assert wagon_recommendation["capacity_sufficient"] is True
    assert len(wagon_recommendation["recommended_wagons"]) == 2

    assignments = [
        {
            "order_id": 4,
            "wagon_id": wagon["wagon_id"],
            "plant_id": plant.id,
            "quantity_tons": wagon["assigned_tons"],
            "estimated_cost": 0,
        }
        for wagon in wagon_recommendation["recommended_wagons"]
    ]
    kpis = calculate_kpis(assignments, wagon_capacities={wagon.id: wagon.max_capacity_tons for wagon in wagons})
    assert kpis["total_orders"] == 1
    assert kpis["total_quantity_tons"] == 90
    assert validate_assignments(assignments, orders=[db_session.get(models.Order, 4)], wagons=wagons, plants=[plant]) == []
