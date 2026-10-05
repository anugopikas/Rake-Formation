from datetime import date, datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base
from app.routers.alerts import get_operational_alerts
from app.routers.forecast import get_demand_forecast


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


def test_demand_forecast_uses_order_volume_by_delivery_date(db_session):
    delivery_date = date.today() + timedelta(days=5)
    db_session.add_all(
        [
            models.Order(
                order_id=1,
                customer_name="ABC Industries",
                material_name="Steel Coil",
                grade="A",
                quantity=820,
                destination="Chennai",
                priority="High",
                delivery_date=delivery_date,
                status="Pending",
            ),
            models.Order(
                order_id=2,
                customer_name="XYZ Metals",
                material_name="Steel Coil",
                grade="A",
                quantity=180,
                destination="Chennai",
                priority="Normal",
                delivery_date=delivery_date,
                status="Pending",
            ),
        ]
    )
    db_session.commit()

    response = get_demand_forecast(db_session)

    assert response == {
        "forecast": [
            {
                "date": delivery_date.isoformat(),
                "actual": 1000,
                "predicted": 1100.0,
            }
        ]
    }


def test_operational_alerts_report_inventory_rake_and_order_risks(db_session):
    delivery_date = date.today() + timedelta(days=1)
    db_session.add_all(
        [
            models.Plant(
                id=1,
                plant_code="PL-001",
                plant_name="Salem Steel Plant",
                region="Salem",
                capacity_tons=10000,
                active=True,
            ),
            models.Wagon(
                id=1,
                wagon_number="WG-001",
                wagon_type="Open",
                max_capacity_tons=100,
                available=False,
            ),
            models.RakePlan(
                id=1,
                plan_code="RP001",
                plan_name="Chennai Steel Rake",
                objective="Steel dispatch",
                status="planned",
            ),
            models.Order(
                order_id=1,
                customer_name="ABC Industries",
                material_name="Steel Coil",
                grade="A",
                quantity=92,
                destination="Chennai",
                priority="High",
                delivery_date=delivery_date,
                status="Pending",
            ),
            models.InventoryItem(
                id=1,
                item_code="SC-001",
                item_name="Steel Coil",
                category="Steel",
                available_units=50,
                location="Salem",
            ),
        ]
    )
    db_session.flush()
    db_session.add(
        models.RakeAssignment(
            rake_plan_id=1,
            order_id=1,
            wagon_id=1,
            plant_id=1,
            origin="Salem",
            destination="Chennai",
            departure_time=datetime.now(),
            arrival_time=datetime.now() + timedelta(hours=5),
            quantity_tons=92,
            status="planned",
        )
    )
    db_session.commit()

    alerts = get_operational_alerts(db_session)["alerts"]

    assert any(
        alert["severity"] == "CRITICAL" and alert["title"] == "Low inventory detected"
        for alert in alerts
    )
    assert any(
        alert["severity"] == "WARNING" and "92%" in alert["message"]
        for alert in alerts
    )
    assert any(alert["title"] == "Order fulfillment risk" for alert in alerts)

