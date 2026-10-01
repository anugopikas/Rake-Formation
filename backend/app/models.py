from sqlalchemy import Column, Integer, String, Date, Float, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


# -------------------- Orders --------------------

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    material_name = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    destination = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    delivery_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)


# -------------------- Inventory --------------------

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    available_units = Column(Integer, nullable=False)
    location = Column(String, nullable=False)


# -------------------- Plants --------------------

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    plant_code = Column(String, unique=True, nullable=False)
    plant_name = Column(String, nullable=False)
    region = Column(String, nullable=False)
    capacity_tons = Column(Float, nullable=False)
    active = Column(Boolean, default=True)


# -------------------- Wagons --------------------

class Wagon(Base):
    __tablename__ = "wagons"

    id = Column(Integer, primary_key=True, index=True)
    wagon_number = Column(String, unique=True, nullable=False)
    wagon_type = Column(String, nullable=False)
    max_capacity_tons = Column(Float, nullable=False)
    available = Column(Boolean, default=True)


# -------------------- Freight Rates --------------------

class FreightRate(Base):
    __tablename__ = "freight_rates"

    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    rate_per_ton = Column(Float, nullable=False)
    effective_from = Column(DateTime, nullable=False)


# -------------------- Railway Rules --------------------

class RailwayRule(Base):
    __tablename__ = "railway_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    priority = Column(Integer, default=1)
    active = Column(Boolean, default=True)


# -------------------- Rake Plans --------------------

class RakePlan(Base):
    __tablename__ = "rake_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String, unique=True, nullable=False)
    plan_name = Column(String, nullable=False)
    objective = Column(String, nullable=False)
    status = Column(String, default="draft")
    created_at = Column(DateTime, server_default=func.now())


# -------------------- Users --------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="analyst")
    active = Column(Boolean, default=True)


# -------------------- Approvals --------------------

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, nullable=False)
    approver_id = Column(Integer, nullable=False)
    decision = Column(String, nullable=False)
    comments = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())