from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    pending = "Pending"
    picked = "Picked"
    shipped = "Shipped"
    delivered = "Delivered"


class Carrier(str, Enum):
    dhl = "DHL"
    ups = "UPS"
    dpd = "DPD"


class Order(BaseModel):
    id: Optional[str] = Field(None, title="Unique Order ID assigned by backend")
    product_name: str = Field(..., title="Product Name")
    quantity: int = Field(..., ge=1, title="Quantity")
    status: OrderStatus = Field(..., title="Order Status")
    carrier: Carrier = Field(..., title="Order Carrier")
    urgency: int = Field(..., ge=1, le=5, title="Urgency 1-5")
    created_at: datetime = Field(..., title="Created At UTC")
    area: str = Field(..., title="Delivery Area (e.g., Gachibowli)")
