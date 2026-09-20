import random
from typing import Any, Dict, List
from backend.app.authorize import authorize


def is_call_violating_intent(action: str, ctx: Dict[str, Any]) -> bool:
    """Determine whether a tool call parameters violate user intent or safety constraints."""
    if action == "ChangeAddress":
        # Any agent-initiated address change violates user intent
        return True

    if action == "AddToCart":
        if ctx["quantity"] > ctx["requested_quantity"]:
            return True
        if ctx["total_paise"] > ctx["budget_paise"]:
            return True
        if ctx["seller_score_pct"] < 30:
            return True
        return False

    if action == "Checkout":
        if not ctx["user_approved"]:
            return True
        if ctx["total_paise"] > ctx["budget_paise"]:
            return True
        return False

    if action == "Search":
        return False

    return True


def run_stress_test(num_calls: int = 200, seed: int = 42) -> Dict[str, Any]:
    """Generate adversarial and boundary tool calls, send to authorize(),

    and track results.
    """
    rng = random.Random(seed)

    allowed_count = 0
    blocked_count = 0
    violating_allowed_count = 0

    rule_counts: Dict[str, int] = {}
    violations: List[Dict[str, Any]] = []

    actions = ["AddToCart", "ChangeAddress", "Checkout", "Search"]

    for i in range(num_calls):
        action = rng.choice(actions)

        # Generate varied adversarial parameters
        budget_paise = rng.choice([250000, 300000, 350000, 500000])
        requested_qty = rng.choice([1, 2])

        # Mix of safe and adversarial inputs
        is_adversarial = rng.random() < 0.75

        if action == "AddToCart":
            if is_adversarial:
                variant = rng.choice(["over_qty", "over_budget", "bad_seller", "multi_violation"])
                if variant == "over_qty":
                    qty = requested_qty + rng.randint(1, 8)
                    total = rng.randint(50000, budget_paise)
                    seller = rng.randint(40, 99)
                elif variant == "over_budget":
                    qty = requested_qty
                    total = budget_paise + rng.randint(1000, 400000)
                    seller = rng.randint(40, 99)
                elif variant == "bad_seller":
                    qty = requested_qty
                    total = rng.randint(50000, budget_paise)
                    seller = rng.randint(0, 29)
                else:  # multi_violation
                    qty = requested_qty + rng.randint(2, 5)
                    total = budget_paise + rng.randint(10000, 300000)
                    seller = rng.randint(0, 25)
            else:
                qty = requested_qty
                total = rng.randint(50000, budget_paise)
                seller = rng.randint(35, 99)

            ctx = {
                "quantity": qty,
                "requested_quantity": requested_qty,
                "total_paise": total,
                "budget_paise": budget_paise,
                "user_approved": False,
                "seller_score_pct": seller,
            }

        elif action == "ChangeAddress":
            ctx = {
                "quantity": 0,
                "requested_quantity": requested_qty,
                "total_paise": rng.randint(50000, budget_paise),
                "budget_paise": budget_paise,
                "user_approved": rng.choice([True, False]),
                "seller_score_pct": 95,
            }

        elif action == "Checkout":
            if is_adversarial:
                variant = rng.choice(["no_approval", "over_budget", "both"])
                if variant == "no_approval":
                    approved = False
                    total = rng.randint(50000, budget_paise)
                elif variant == "over_budget":
                    approved = True
                    total = budget_paise + rng.randint(5000, 200000)
                else:
                    approved = False
                    total = budget_paise + rng.randint(5000, 200000)
            else:
                approved = True
                total = rng.randint(50000, budget_paise)

            ctx = {
                "quantity": requested_qty,
                "requested_quantity": requested_qty,
                "total_paise": total,
                "budget_paise": budget_paise,
                "user_approved": approved,
                "seller_score_pct": 95,
            }

        else:  # Search
            ctx = {
                "quantity": 0,
                "requested_quantity": requested_qty,
                "total_paise": 0,
                "budget_paise": budget_paise,
                "user_approved": False,
                "seller_score_pct": 100,
            }

        res = authorize(action, ctx)
        allowed = res["allowed"]
        primary_rule = res["rule_ids"][0] if res["rule_ids"] else "unknown"

        rule_counts[primary_rule] = rule_counts.get(primary_rule, 0) + 1

        if allowed:
            allowed_count += 1
        else:
            blocked_count += 1

        violates_intent = is_call_violating_intent(action, ctx)
        if violates_intent and allowed:
            violating_allowed_count += 1
            violations.append({
                "index": i + 1,
                "action": action,
                "context": ctx,
                "rule": primary_rule,
                "reason": res["reason"],
            })

    return {
        "total_calls": num_calls,
        "allowed_count": allowed_count,
        "blocked_count": blocked_count,
        "rule_counts": rule_counts,
        "violating_allowed_count": violating_allowed_count,
        "violations": violations,
    }


def main():
    report = run_stress_test(200)
    print("\n================ CEDAR STRESS TEST REPORT ================")
    print(f"Total Calls Evaluated: {report['total_calls']}")
    print(f"Allowed Calls:         {report['allowed_count']}")
    print(f"Blocked Calls:         {report['blocked_count']}")
    print("\nDecision Breakdown by Rule:")
    for rule, cnt in sorted(report["rule_counts"].items()):
        print(f"  - {rule:28s}: {cnt:4d}")
    print(f"\nCalls Violating User Intent Yet Allowed: {report['violating_allowed_count']}")
    print("==========================================================\n")

    if report["violating_allowed_count"] > 0:
        print("FAIL: Intent-violating calls were permitted by Cedar policy:")
        for v in report["violations"]:
            print(f"  {v}")
        raise AssertionError(
            f"Expected 0 intent violations allowed, but found {report['violating_allowed_count']}"
        )
    else:
        print("SUCCESS: 0 intent-violating calls permitted. Cedar policy backstop is airtight.")


if __name__ == "__main__":
    main()
