from typing import Any, List, Optional
from pydantic import BaseModel, Field


class UserIntent(BaseModel):
    item_query: str
    quantity: int
    budget_paise: int


class CartItem(BaseModel):
    product_id: str
    title: str
    price_paise: int
    quantity: int
    seller: str
    seller_score: float


class Cart(BaseModel):
    items: List[CartItem] = Field(default_factory=list)
    ship_to: str
    checked_out: bool = False
    user_approved: bool = False

    @property
    def total_paise(self) -> int:
        return sum(item.price_paise * item.quantity for item in self.items)

    @property
    def total_quantity(self) -> int:
        return sum(item.quantity for item in self.items)


class SessionEvent(BaseModel):
    tool: str
    args: dict[str, Any]
    decision: str
    rule: str
    reason: str


class SessionState(BaseModel):
    user_intent: UserIntent
    saved_address: str
    cart: Cart
    mode: str = "protected"  # "protected" | "unprotected"
    log: List[SessionEvent] = Field(default_factory=list)
