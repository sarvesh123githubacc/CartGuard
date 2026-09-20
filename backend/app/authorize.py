import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import cedarpy

# Resolve paths to cedar policies and schema
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent
BACKEND_DIR = CURRENT_DIR.parent

CEDAR_POLICIES_PATH = (
    BACKEND_DIR / "cedar" / "policies.cedar"
    if (BACKEND_DIR / "cedar" / "policies.cedar").exists()
    else PROJECT_ROOT / "cedar" / "policies.cedar"
)

CEDAR_SCHEMA_PATH = (
    BACKEND_DIR / "cedar" / "schema.cedarschema"
    if (BACKEND_DIR / "cedar" / "schema.cedarschema").exists()
    else PROJECT_ROOT / "cedar" / "schema.cedarschema"
)

# Friendly descriptions for Cedar rules
FRIENDLY_RULE_NAMES: Dict[str, str] = {
    "permit-search": "Permit search for catalog items",
    "permit-add-to-cart": "Permit adding item within requested quantity and budget limits",
    "forbid-untrusted-seller": "BLOCKED: Untrusted seller reputation score is below 30% threshold",
    "forbid-change-address": "BLOCKED: Agents are strictly forbidden from modifying shipping address",
    "permit-checkout": "Permit checkout with explicit user approval and within budget",
    "default-deny": "BLOCKED: Action not permitted by Cedar policies (exceeds constraints or lacks approval)",
}


def _load_policies() -> str:
    if not CEDAR_POLICIES_PATH.exists():
        raise FileNotFoundError(f"Cedar policies file not found at {CEDAR_POLICIES_PATH}")
    return CEDAR_POLICIES_PATH.read_text(encoding="utf-8")


def _load_schema() -> Optional[cedarpy.Schema]:
    if CEDAR_SCHEMA_PATH.exists():
        schema_text = CEDAR_SCHEMA_PATH.read_text(encoding="utf-8")
        return cedarpy.Schema.from_str(schema_text)
    return None


_CACHED_POLICIES = _load_policies()
_CACHED_SCHEMA = _load_schema()


def authorize(
    action: str,
    context: Dict[str, Any],
    principal_id: str = "shopper",
    resource_id: str = "active",
) -> Dict[str, Any]:
    """Evaluate an agent tool action against Cedar policies using cedarpy.

    Args:
        action: Cedar action name (Search, AddToCart, ChangeAddress, Checkout)
        context: Context dictionary matching Cedar schema:
            - quantity (int)
            - requested_quantity (int)
            - total_paise (int)
            - budget_paise (int)
            - user_approved (bool)
            - seller_score_pct (int)
        principal_id: Agent identifier (default: shopper)
        resource_id: Cart identifier (default: active)

    Returns:
        Dict with keys:
            - allowed: bool
            - rule_ids: list[str]
            - reason: str
    """
    # Normalize context integers (no decimals per Cedar specification)
    normalized_context = {
        "quantity": int(context.get("quantity", 0)),
        "requested_quantity": int(context.get("requested_quantity", 0)),
        "total_paise": int(context.get("total_paise", 0)),
        "budget_paise": int(context.get("budget_paise", 0)),
        "user_approved": bool(context.get("user_approved", False)),
        "seller_score_pct": int(context.get("seller_score_pct", 100)),
    }

    request = {
        "principal": {"type": "Agent", "id": principal_id},
        "action": {"type": "Action", "id": action},
        "resource": {"type": "Cart", "id": resource_id},
        "context": normalized_context,
    }

    authz_result = cedarpy.is_authorized(
        request,
        _CACHED_POLICIES,
        [],
        schema=_CACHED_SCHEMA,
    )

    allowed = authz_result.allowed

    # Extract human-readable @id rule annotations from diagnostics
    id_map = getattr(authz_result.diagnostics, "id_annotations_by_reason", {}) or {}
    raw_reasons = getattr(authz_result.diagnostics, "reasons", []) or []
    rule_ids = [id_map.get(r, r) for r in raw_reasons]

    if allowed:
        rule_name = rule_ids[0] if rule_ids else "permit-default"
        reason_text = FRIENDLY_RULE_NAMES.get(rule_name, f"Authorized under {rule_name}")
    else:
        if rule_ids:
            rule_name = rule_ids[0]
            reason_text = FRIENDLY_RULE_NAMES.get(rule_name, f"Blocked under {rule_name}")
        else:
            rule_ids = ["default-deny"]
            # Provide specific deterministic context explanations for default-deny
            if action == "AddToCart":
                if normalized_context["quantity"] > normalized_context["requested_quantity"]:
                    reason_text = (
                        f"BLOCKED: Requested quantity ({normalized_context['quantity']}) "
                        f"exceeds user approved quantity ({normalized_context['requested_quantity']})"
                    )
                elif normalized_context["total_paise"] > normalized_context["budget_paise"]:
                    reason_text = (
                        f"BLOCKED: Projected cart total ({normalized_context['total_paise']} paise) "
                        f"exceeds user budget ({normalized_context['budget_paise']} paise)"
                    )
                else:
                    reason_text = "BLOCKED: AddToCart failed policy conditions"
            elif action == "Checkout":
                if not normalized_context["user_approved"]:
                    reason_text = "BLOCKED: Checkout requires explicit user approval (user_approved=false)"
                elif normalized_context["total_paise"] > normalized_context["budget_paise"]:
                    reason_text = (
                        f"BLOCKED: Total checkout cost ({normalized_context['total_paise']} paise) "
                        f"exceeds budget ({normalized_context['budget_paise']} paise)"
                    )
                else:
                    reason_text = "BLOCKED: Checkout failed policy conditions"
            else:
                reason_text = f"BLOCKED: Action '{action}' is not permitted by Cedar policy"

    return {
        "allowed": allowed,
        "rule_ids": rule_ids,
        "reason": reason_text,
    }
