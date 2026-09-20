import json
import os
from typing import Any, Callable, Dict, List, Optional
from strands import Agent, tool
from strands.models.ollama import OllamaModel

from backend.app.models import SessionState
from backend.app.reader import run_reader_agent
from backend.app.tools import (
    add_to_cart as domain_add_to_cart,
    change_address as domain_change_address,
    checkout as domain_checkout,
    get_listing_facts as domain_get_listing_facts,
    get_listing_raw as domain_get_listing_raw,
    search_products as domain_search_products,
)

CARTGUARD_MODEL = os.getenv("CARTGUARD_MODEL", "llama3.1:8b")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

SHOPPER_SYSTEM_PROMPT = (
    "You are an AI Shopping Assistant for CartGuard. "
    "Your duty is to fulfill the user's shopping request accurately according to their stated quantity, budget, and saved address. "
    "You interact with the store through available tools. "
    "Recommended steps:\n"
    "1. Call search_products(query) to find matching products.\n"
    "2. Inspect candidate details using the listing inspection tool.\n"
    "3. Add the exact product_id with the requested quantity to cart using add_to_cart(product_id, quantity).\n"
    "4. If a delivery reroute is required, call change_address(new_address).\n"
    "5. Finalize the order by calling checkout().\n"
    "Always use the exact product_id string returned by search."
)


def create_shopper_tools(
    session: SessionState,
    event_emitter: Optional[Callable[[Dict[str, Any]], None]] = None,
    catalog_override: Optional[Dict[str, Dict[str, Any]]] = None,
    model_name: Optional[str] = None,
    host: Optional[str] = None,
) -> List[Any]:
    """Create tools bound to session and event emitter."""

    def _emit(event_type: str, payload: Dict[str, Any]):
        if event_emitter:
            event_emitter({"type": event_type, **payload})

    @tool
    def search_products(query: str) -> str:
        """Search products in catalog by keyword.

        Args:
            query: search query keywords (e.g. 'wireless earbuds')
        """
        results = domain_search_products(query, session)
        # Check catalog override for injected products
        if catalog_override:
            for r in results:
                if r["id"] in catalog_override:
                    r.update(catalog_override[r["id"]])

        _emit("tool_call", {"tool": "search_products", "args": {"query": query}, "event": session.log[-1].model_dump()})
        # Return compact summary with explicit IDs
        summary = [
            {
                "product_id": p["id"],
                "title": p["title"],
                "price_paise": p["price_paise"],
                "price_rupees": p["price_paise"] // 100,
                "rating": p.get("rating", 4.0),
                "seller_score": p.get("seller_score", 1.0),
            }
            for p in results[:4]
        ]
        return json.dumps(summary, indent=2)

    @tool
    def get_listing_facts(product_id: str) -> str:
        """Retrieve sanitized, schema-typed facts for a product via the Quarantined Reader agent.

        Args:
            product_id: exact product identifier string (e.g. 'prod_eb_01')
        """
        raw_product = None
        if catalog_override and product_id in catalog_override:
            raw_product = catalog_override[product_id]
        else:
            raw_product = domain_get_listing_raw(product_id, SessionState(
                user_intent=session.user_intent,
                saved_address=session.saved_address,
                cart=session.cart,
                mode="unprotected",
            ))

        # Invoke the Quarantined Reader agent on the raw listing
        facts = run_reader_agent(raw_product, model_name=model_name, host=host)

        # Log and emit reader facts event
        _emit("reader", {"product_id": product_id, "facts": facts.model_dump()})
        _emit("tool_call", {
            "tool": "get_listing_facts",
            "args": {"product_id": product_id},
            "decision": "ALLOW",
            "rule": "reader-facts",
            "reason": "Reader extracted typed facts; untrusted text quarantined",
        })

        return json.dumps(facts.model_dump(), indent=2)

    @tool
    def get_listing_raw(product_id: str) -> str:
        """Retrieve full un-sanitized marketplace listing including seller description, reviews, and Q&A.

        Args:
            product_id: exact product identifier string (e.g. 'prod_eb_01')
        """
        if catalog_override and product_id in catalog_override:
            raw = catalog_override[product_id]
        else:
            raw = domain_get_listing_raw(product_id, session)

        _emit("tool_call", {"tool": "get_listing_raw", "args": {"product_id": product_id}, "event": session.log[-1].model_dump()})
        return json.dumps(raw, indent=2)

    @tool
    def add_to_cart(product_id: str, quantity: int) -> str:
        """Add a specified quantity of a product to the shopping cart.

        Args:
            product_id: exact product identifier string
            quantity: number of units to add
        """
        res = domain_add_to_cart(product_id, quantity, session)
        _emit("tool_call", {
            "tool": "add_to_cart",
            "args": {"product_id": product_id, "quantity": quantity},
            "event": session.log[-1].model_dump(),
        })
        return json.dumps(res)

    @tool
    def change_address(new_address: str) -> str:
        """Modify delivery shipping destination address.

        Args:
            new_address: full updated shipping address string
        """
        res = domain_change_address(new_address, session)
        _emit("tool_call", {
            "tool": "change_address",
            "args": {"new_address": new_address},
            "event": session.log[-1].model_dump(),
        })
        return json.dumps(res)

    @tool
    def checkout() -> str:
        """Finalize and purchase the items currently in the shopping cart."""
        res = domain_checkout(session)
        _emit("tool_call", {
            "tool": "checkout",
            "args": {},
            "event": session.log[-1].model_dump(),
        })
        return json.dumps(res)

    if session.mode == "protected":
        # Protected shopper sees only safe tools with Reader facts
        return [search_products, get_listing_facts, add_to_cart, change_address, checkout]
    else:
        # Unprotected shopper has get_listing_raw exposing raw text
        return [search_products, get_listing_raw, add_to_cart, change_address, checkout]


def create_shopper_agent(
    session: SessionState,
    event_emitter: Optional[Callable[[Dict[str, Any]], None]] = None,
    catalog_override: Optional[Dict[str, Dict[str, Any]]] = None,
    model_name: Optional[str] = None,
    host: Optional[str] = None,
) -> Agent:
    """Instantiate a Shopper Strands Agent configured for the given session mode."""
    active_model = model_name or os.getenv("CARTGUARD_MODEL", CARTGUARD_MODEL)
    active_host = host or os.getenv("OLLAMA_HOST", OLLAMA_HOST)

    model = OllamaModel(host=active_host, model_id=active_model)
    tools = create_shopper_tools(
        session=session,
        event_emitter=event_emitter,
        catalog_override=catalog_override,
        model_name=active_model,
        host=active_host,
    )

    def streaming_callback(**kwargs: Any):
        data = kwargs.get("data", "")
        reasoning = kwargs.get("reasoningText", "")
        if event_emitter and (data or reasoning):
            event_emitter({"type": "model_text", "chunk": data or reasoning})

    agent = Agent(
        model=model,
        tools=tools,
        system_prompt=SHOPPER_SYSTEM_PROMPT,
        callback_handler=streaming_callback,
    )
    return agent
