import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.app.authorize import authorize
from backend.app.models import CartItem, SessionEvent, SessionState

# Resolve catalog path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent
BACKEND_DIR = CURRENT_DIR.parent

CATALOG_PATH = (
    BACKEND_DIR / "data" / "catalog.json"
    if (BACKEND_DIR / "data" / "catalog.json").exists()
    else PROJECT_ROOT / "data" / "catalog.json"
)


def load_catalog() -> List[Dict[str, Any]]:
    if not CATALOG_PATH.exists():
        raise FileNotFoundError(f"Catalog file not found at {CATALOG_PATH}")
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


_CATALOG = load_catalog()
_PRODUCT_MAP = {p["id"]: p for p in _CATALOG}


def resolve_product_id(pid_or_query: str) -> Optional[str]:
    """Resolve a product ID from exact ID, title, or fuzzy reference."""
    if not pid_or_query:
        return None
    cleaned = str(pid_or_query).strip()
    if cleaned in _PRODUCT_MAP:
        return cleaned
    for pid in _PRODUCT_MAP:
        if pid.lower() == cleaned.lower():
            return pid
    for pid, p in _PRODUCT_MAP.items():
        if p["title"].lower() in cleaned.lower() or cleaned.lower() in p["title"].lower():
            return pid
    if "first" in cleaned.lower() or "top" in cleaned.lower():
        return "prod_eb_01"
    return None



def search_products(
    query: str,
    session: SessionState,
    max_results: int = 5,
) -> List[Dict[str, Any]]:
    """Search catalog products by query string.

    In protected mode, validates authorization with Cedar.
    Appends event to session log.
    """
    args = {"query": query, "max_results": max_results}
    if session.mode == "protected":
        auth_context = {
            "quantity": 0,
            "requested_quantity": session.user_intent.quantity,
            "total_paise": session.cart.total_paise,
            "budget_paise": session.user_intent.budget_paise,
            "user_approved": session.cart.user_approved,
            "seller_score_pct": 100,
        }
        auth_res = authorize("Search", auth_context)
        decision = "ALLOW" if auth_res["allowed"] else "DENY"
        rule = auth_res["rule_ids"][0] if auth_res["rule_ids"] else "default-deny"
        reason = auth_res["reason"]
    else:
        decision = "ALLOW"
        rule = "unprotected"
        reason = "Unprotected mode: authorization bypassed"

    session.log.append(
        SessionEvent(
            tool="search_products",
            args=args,
            decision=decision,
            rule=rule,
            reason=reason,
        )
    )

    if decision == "DENY":
        return []

    tokens = [t.lower() for t in query.split() if t.strip()]
    results = []
    for prod in _CATALOG:
        text_corpus = (
            f"{prod['title']} {prod.get('description', '')} "
            f"{' '.join(str(v) for v in prod.get('specs', {}).values())}"
        ).lower()
        if not tokens or any(tok in text_corpus for tok in tokens):
            results.append(prod)
            if len(results) >= max_results:
                break

    return results


def get_listing_raw(product_id: str, session: SessionState) -> Dict[str, Any]:
    """Retrieve raw untrusted product listing. Unprotected mode only."""
    resolved_id = resolve_product_id(product_id) or product_id
    args = {"product_id": resolved_id}

    if session.mode == "protected":
        # In protected mode, raw listing access is denied to shopping agents
        decision = "DENY"
        rule = "forbid-raw-listing"
        reason = "BLOCKED: Protected mode forbids direct agent access to untrusted raw text listings"
        session.log.append(
            SessionEvent(
                tool="get_listing_raw",
                args=args,
                decision=decision,
                rule=rule,
                reason=reason,
            )
        )
        return {"error": reason, "decision": "DENY"}

    decision = "ALLOW"
    rule = "unprotected"
    reason = "Unprotected mode: raw listing accessed"
    session.log.append(
        SessionEvent(
            tool="get_listing_raw",
            args=args,
            decision=decision,
            rule=rule,
            reason=reason,
        )
    )

    product = _PRODUCT_MAP.get(resolved_id)
    if not product:
        return {"error": f"Product {resolved_id} not found"}
    return product


def get_listing_facts(product_id: str, session: SessionState) -> Dict[str, Any]:
    """Retrieve typed, sanitized schema facts (Quarantined Reader output)."""
    resolved_id = resolve_product_id(product_id) or product_id
    args = {"product_id": resolved_id}
    product = _PRODUCT_MAP.get(resolved_id)

    decision = "ALLOW"
    rule = "reader-facts"
    reason = "Reader extracted schema-typed facts; untrusted text sanitized"

    session.log.append(
        SessionEvent(
            tool="get_listing_facts",
            args=args,
            decision=decision,
            rule=rule,
            reason=reason,
        )
    )

    if not product:
        return {"error": f"Product {resolved_id} not found"}

    # Return only typed facts, strictly removing untrusted free text fields
    return {
        "id": product["id"],
        "title": product["title"],
        "price_paise": product["price_paise"],
        "rating": product["rating"],
        "seller": product["seller"],
        "seller_score": product["seller_score"],
        "specs": product.get("specs", {}),
    }


def add_to_cart(product_id: str, quantity: int, session: SessionState) -> Dict[str, Any]:
    """Add a specified quantity of a product to the cart.

    In protected mode, evaluates Cedar authorization first.
    """
    resolved_id = resolve_product_id(product_id) or product_id
    args = {"product_id": resolved_id, "quantity": quantity}
    product = _PRODUCT_MAP.get(resolved_id)
    if not product:
        return {"success": False, "error": f"Product '{resolved_id}' not found"}

    item_price = product["price_paise"]
    seller_score_pct = int(round(product.get("seller_score", 1.0) * 100))
    projected_total = session.cart.total_paise + (item_price * quantity)

    if session.mode == "protected":
        auth_context = {
            "quantity": quantity,
            "requested_quantity": session.user_intent.quantity,
            "total_paise": projected_total,
            "budget_paise": session.user_intent.budget_paise,
            "user_approved": session.cart.user_approved,
            "seller_score_pct": seller_score_pct,
        }
        auth_res = authorize("AddToCart", auth_context)
        allowed = auth_res["allowed"]
        decision = "ALLOW" if allowed else "DENY"
        rule = auth_res["rule_ids"][0] if auth_res["rule_ids"] else "default-deny"
        reason = auth_res["reason"]
    else:
        allowed = True
        decision = "ALLOW"
        rule = "unprotected"
        reason = "Unprotected mode: item added without authorization check"

    session.log.append(
        SessionEvent(
            tool="add_to_cart",
            args=args,
            decision=decision,
            rule=rule,
            reason=reason,
        )
    )

    if not allowed:
        return {
            "success": False,
            "decision": "DENY",
            "rule": rule,
            "error": reason,
        }

    # Add item to cart
    cart_item = CartItem(
        product_id=product["id"],
        title=product["title"],
        price_paise=product["price_paise"],
        quantity=quantity,
        seller=product["seller"],
        seller_score=product.get("seller_score", 1.0),
    )
    session.cart.items.append(cart_item)

    return {
        "success": True,
        "decision": "ALLOW",
        "rule": rule,
        "item": cart_item.model_dump(),
        "cart_total_paise": session.cart.total_paise,
        "cart_quantity": session.cart.total_quantity,
    }


def change_address(new_address: str, session: SessionState) -> Dict[str, Any]:
    """Change the cart delivery address.

    Forbidden by Cedar for agents in protected mode.
    """
    args = {"new_address": new_address}

    if session.mode == "protected":
        auth_context = {
            "quantity": 0,
            "requested_quantity": session.user_intent.quantity,
            "total_paise": session.cart.total_paise,
            "budget_paise": session.user_intent.budget_paise,
            "user_approved": session.cart.user_approved,
            "seller_score_pct": 100,
        }
        auth_res = authorize("ChangeAddress", auth_context)
        allowed = auth_res["allowed"]
        decision = "ALLOW" if allowed else "DENY"
        rule = auth_res["rule_ids"][0] if auth_res["rule_ids"] else "forbid-change-address"
        reason = auth_res["reason"]
    else:
        allowed = True
        decision = "ALLOW"
        rule = "unprotected"
        reason = "Unprotected mode: shipping address modified"

    session.log.append(
        SessionEvent(
            tool="change_address",
            args=args,
            decision=decision,
            rule=rule,
            reason=reason,
        )
    )

    if not allowed:
        return {
            "success": False,
            "decision": "DENY",
            "rule": rule,
            "error": reason,
            "ship_to": session.cart.ship_to,
        }

    session.cart.ship_to = new_address
    return {
        "success": True,
        "decision": "ALLOW",
        "rule": rule,
        "ship_to": new_address,
    }


def checkout(session: SessionState) -> Dict[str, Any]:
    """Execute checkout on the active cart.

    Requires user_approved and total <= budget in protected mode.
    """
    args = {}

    if session.mode == "protected":
        auth_context = {
            "quantity": session.cart.total_quantity,
            "requested_quantity": session.user_intent.quantity,
            "total_paise": session.cart.total_paise,
            "budget_paise": session.user_intent.budget_paise,
            "user_approved": session.cart.user_approved,
            "seller_score_pct": 100,
        }
        auth_res = authorize("Checkout", auth_context)
        allowed = auth_res["allowed"]
        decision = "ALLOW" if allowed else "DENY"
        rule = auth_res["rule_ids"][0] if auth_res["rule_ids"] else "default-deny"
        reason = auth_res["reason"]
    else:
        allowed = True
        decision = "ALLOW"
        rule = "unprotected"
        reason = "Unprotected mode: checkout executed without authorization"

    session.log.append(
        SessionEvent(
            tool="checkout",
            args=args,
            decision=decision,
            rule=rule,
            reason=reason,
        )
    )

    if not allowed:
        return {
            "success": False,
            "decision": "DENY",
            "rule": rule,
            "error": reason,
            "checked_out": False,
        }

    session.cart.checked_out = True
    return {
        "success": True,
        "decision": "ALLOW",
        "rule": rule,
        "checked_out": True,
        "total_paise": session.cart.total_paise,
    }
