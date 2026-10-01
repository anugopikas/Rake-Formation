from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ==========================================================
# Orders
# ==========================================================

class OrderBase(BaseModel):
    customer_name: str
    material_name: str
    grade: str
    quantity: int
    destination: str
    priority: str
    delivery_date: date
    status: str


class OrderCreate(OrderBase):
    pass


class Order(OrderBase):
    order_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Inventory
# ==========================================================

class InventoryItemBase(BaseModel):
    item_code: str
    item_name: str
    category: str
    available_units: int
    location: str


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItem(InventoryItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Plants
# ==========================================================

class PlantBase(BaseModel):
    plant_code: str
    plant_name: str
    region: str
    capacity_tons: float
    active: bool = True


class PlantCreate(PlantBase):
    pass


class Plant(PlantBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Wagons
# ==========================================================

class WagonBase(BaseModel):
    wagon_number: str
    wagon_type: str
    max_capacity_tons: float
    available: bool = True


class WagonCreate(WagonBase):
    pass


class Wagon(WagonBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Freight Rates
# ==========================================================

class FreightRateBase(BaseModel):
    route_code: str
    origin: str
    destination: str
    rate_per_ton: float
    effective_from: datetime


class FreightRateCreate(FreightRateBase):
    pass


class FreightRate(FreightRateBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Railway Rules
# ==========================================================

class RailwayRuleBase(BaseModel):
    rule_code: str
    description: str
    priority: int = 1
    active: bool = True


class RailwayRuleCreate(RailwayRuleBase):
    pass


class RailwayRule(RailwayRuleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Rake Plans
# ==========================================================

class RakePlanBase(BaseModel):
    plan_code: str
    plan_name: str
    objective: str
    status: str = "draft"


class RakePlanCreate(RakePlanBase):
    pass


class RakePlan(RakePlanBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Users
# ==========================================================

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "analyst"
    active: bool = True


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Approvals
# ==========================================================

class ApprovalBase(BaseModel):
    order_id: int
    approver_id: int
    decision: str
    comments: Optional[str] = None


class ApprovalCreate(ApprovalBase):
    pass


class Approval(ApprovalBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# AI Recommendation
# ==========================================================

class RecommendationResponse(BaseModel):
    order_id: int
    recommended_plant: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    material: Optional[str] = None
    quantity: int
    allocated_wagons: int
    estimated_cost: float
    estimated_time: str
    decision: str
    reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)