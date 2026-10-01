from datetime import date, datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.ai.planner import generate_recommendation
from app.database import Base
from app import models


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_generate_recommendation_raises_for_unknown_order(db_session):
    with pytest.raises(ValueError):
        generate_recommendation(order_id=999, db=db_session)


def test_generate_recommendation_returns_approved_for_feasible_order(db_session):
    db_session.add(
        models.Plant(
            plant_code="PL-001",
            plant_name="Salem Steel Plant",
            region="Salem",
            capacity_tons=10000,
            active=True,
        )
    )
    db_session.add(
        models.InventoryItem(
            item_code="INV-001",
            item_name="Steel",
            category="Raw Material",
            available_units=1000,
            location="Salem",
        )
    )
    db_session.add(
        models.Wagon(
            wagon_number="WG-001",
            wagon_type="Open",
            max_capacity_tons=50,
            available=True,
        )
    )
    db_session.add(
        models.Wagon(
            wagon_number="WG-002",
            wagon_type="Open",
            max_capacity_tons=50,
            available=True,
        )
    )
    db_session.add(
        models.FreightRate(
            route_code="RT-001",
            origin="Salem",
            destination="Chennai",
            rate_per_ton=1500,
            effective_from=datetime(2026, 1, 1),
        )
    )
    db_session.add(
        models.RailwayRule(
            rule_code="RULE-001",
            description="Maximum wagons per formation is 5",
            priority=1,
            active=True,
        )
    )
    db_session.add(
        models.Order(
            customer_name="ABC Industries",
            material_name="Steel",
            grade="A",
            quantity=100,
            destination="Chennai",
            priority="High",
            delivery_date=date(2026, 8, 10),
            status="Pending",
        )
    )
    db_session.commit()

    result = generate_recommendation(order_id=1, db=db_session)

    assert result["decision"] == "APPROVED"
    assert result["recommended_plant"] == "Salem Steel Plant"
    assert result["allocated_wagons"] >= 1
    assert result["reasons"]
    assert "Inventory" in result["constraints_checked"]


def test_generate_recommendation_returns_rejected_for_insufficient_inventory(db_session):
    db_session.add(
        models.Plant(
            plant_code="PL-002",
            plant_name="Bokaro Plant",
            region="Bokaro",
            capacity_tons=1000,
            active=True,
        )
    )
    db_session.add(
        models.InventoryItem(
            item_code="INV-002",
            item_name="Steel",
            category="Raw Material",
            available_units=10,
            location="Bokaro",
        )
    )
    db_session.add(
        models.Wagon(
            wagon_number="WG-003",
            wagon_type="Open",
            max_capacity_tons=50,
            available=True,
        )
    )
    db_session.add(
        models.FreightRate(
            route_code="RT-002",
            origin="Bokaro",
            destination="Mumbai",
            rate_per_ton=1200,
            effective_from=datetime(2026, 1, 1),
        )
    )
    db_session.add(
        models.RailwayRule(
            rule_code="RULE-002",
            description="Maximum wagons per formation is 5",
            priority=1,
            active=True,
        )
    )
    db_session.add(
        models.Order(
            customer_name="XYZ Metals",
            material_name="Steel",
            grade="A",
            quantity=100,
            destination="Mumbai",
            priority="High",
            delivery_date=date(2026, 8, 10),
            status="Pending",
        )
    )
    db_session.commit()

    result = generate_recommendation(order_id=1, db=db_session)

    assert result["decision"] == "REJECTED"
    assert result["reasons"]
    assert "Inventory" in result["constraints_checked"]


def test_generate_recommendation_returns_review_required_for_missing_freight_data(db_session):
    db_session.add(
        models.Plant(
            plant_code="PL-003",
            plant_name="Vizag Plant",
            region="Vizag",
            capacity_tons=1000,
            active=True,
        )
    )
    db_session.add(
        models.InventoryItem(
            item_code="INV-003",
            item_name="Steel",
            category="Raw Material",
            available_units=500,
            location="Vizag",
        )
    )
    db_session.add(
        models.Wagon(
            wagon_number="WG-004",
            wagon_type="Open",
            max_capacity_tons=50,
            available=True,
        )
    )
    db_session.add(
        models.RailwayRule(
            rule_code="RULE-003",
            description="Maximum wagons per formation is 5",
            priority=1,
            active=True,
        )
    )
    db_session.add(
        models.Order(
            customer_name="LMN Industries",
            material_name="Steel",
            grade="A",
            quantity=100,
            destination="Kochi",
            priority="High",
            delivery_date=date(2026, 8, 10),
            status="Pending",
        )
    )
    db_session.commit()

    result = generate_recommendation(order_id=1, db=db_session)

    assert result["decision"] == "REVIEW REQUIRED"
    assert result["warnings"]
    assert "Freight Rate" in result["constraints_checked"]
