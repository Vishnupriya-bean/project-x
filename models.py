from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    pending = "Pending"
    picked = "Picked"
    shipped = "Shipped"
    delivered = "Delivered"


class PaymentStatus(str, Enum):
    done = "Done"
    remaining = "Remaining"


class Carrier(str, Enum):
    dhl = "DHL"
    ups = "UPS"
    dpd = "DPD"


class Order(BaseModel):
    id: Optional[str] = Field(None, title="Unique Order ID assigned by backend")
    phone: Optional[str] = Field(None, title="Customer Phone Number")
    product_name: str = Field(..., title="Product Name")
    quantity: int = Field(..., ge=1, title="Quantity")
    status: OrderStatus = Field(..., title="Order Status")
    carrier: Carrier = Field(..., title="Order Carrier")
    urgency: int = Field(..., ge=1, le=5, title="Urgency 1-5")
    payment: PaymentStatus = Field(default=PaymentStatus.remaining, title="Payment Status")
    created_at: Optional[datetime] = Field(None, title="Created At UTC")
    shipped_at: Optional[datetime] = Field(None, title="Shipped At UTC")
    delivered_at: Optional[datetime] = Field(None, title="Delivered At UTC")
    area: str = Field(..., title="Delivery Area (e.g., Gachibowli)")
