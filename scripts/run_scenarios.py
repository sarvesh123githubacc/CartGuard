import argparse
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.app.scenario_runner import load_attacks, run_scenario_sync


def format_currency_paise(paise: int) -> str:
    rupees = paise / 100.0
    return f"₹{rupees:.2f}"


def run_cli(
    selected_attack: str = "all",
    selected_mode: str = "both",
    model_name: str = "llama3.1:8b",
):
    attacks = load_attacks()
    if selected_attack != "all":
        attacks = [a for a in attacks if a["id"] == selected_attack]
        if not attacks:
            print(f"Error: Attack ID '{selected_attack}' not found.")
            sys.exit(1)

    modes = ["unprotected", "protected"] if selected_mode == "both" else [selected_mode]

    print("=" * 80)
    print(" CARTGUARD SECURITY BENCHMARK — SIDE-BY-SIDE ATTACK SIMULATION")
    print(f" Target Model: {model_name}")
    print(f" Attacks:      {len(attacks)}")
    print(f" Modes:        {', '.join(modes)}")
    print("=" * 80)

    results: List[Dict[str, Any]] = []

    for idx, atk in enumerate(attacks, start=1):
        print(f"\n[{idx}/{len(attacks)}] Evaluating Attack: {atk['id']} ({atk['name']})")
        print(f"      Goal: {atk['attacker_goal']} | Vector: {atk['vector']}")

        for mode in modes:
            print(f"  --> Running Mode: [{mode.upper()}] ...", end="", flush=True)
            t0 = time.time()
            try:
                events = run_scenario_sync(
                    attack_id=atk["id"],
                    mode=mode,
                    model_name=model_name,
                )
                elapsed = time.time() - t0
                print(f" Done ({elapsed:.1f}s)")

                # Extract key metrics from events
                final_cart = {}
                eval_data = {}
                tools_used = []
                cedar_blocks = []

                for ev in events:
                    if ev.get("type") == "final_cart":
                        final_cart = ev.get("cart", {})
                    elif ev.get("type") == "evaluation":
                        eval_data = ev
                    elif ev.get("type") == "tool_call":
                        tool_name = ev.get("tool")
                        if tool_name not in tools_used:
                            tools_used.append(tool_name)
                        event_info = ev.get("event", {})
                        if event_info.get("decision") == "DENY":
                            cedar_blocks.append(event_info.get("rule", "DENY"))

                succeeded = eval_data.get("attack_succeeded", False)
                why = eval_data.get("why", "N/A")

                results.append({
                    "attack_id": atk["id"],
                    "goal": atk["attacker_goal"],
                    "vector": atk["vector"],
                    "mode": mode,
                    "succeeded": succeeded,
                    "tools": ", ".join(tools_used),
                    "cedar_blocks": ", ".join(cedar_blocks) if cedar_blocks else "None",
                    "cart_qty": final_cart.get("total_quantity", 0) if "total_quantity" in final_cart else len(final_cart.get("items", [])),
                    "total_paise": sum(i["price_paise"] * i["quantity"] for i in final_cart.get("items", [])),
                    "ship_to": final_cart.get("ship_to", "saved"),
                    "checked_out": final_cart.get("checked_out", False),
                    "why": why,
                })

            except Exception as e:
                print(f" FAILED ({e})")
                results.append({
                    "attack_id": atk["id"],
                    "goal": atk["attacker_goal"],
                    "vector": atk["vector"],
                    "mode": mode,
                    "succeeded": False,
                    "tools": "ERROR",
                    "cedar_blocks": "ERROR",
                    "cart_qty": 0,
                    "total_paise": 0,
                    "ship_to": "error",
                    "checked_out": False,
                    "why": f"Error: {str(e)}",
                })

    # Print Formatted Results Table
    print("\n\n" + "=" * 115)
    print("                                   CARTGUARD FINAL BENCHMARK SUMMARY TABLE")
    print("=" * 115)
    header = f"{'Attack ID':32s} | {'Goal':18s} | {'Mode':12s} | {'Succeeded?':11s} | {'Cedar Block':20s} | {'Why'}"
    print(header)
    print("-" * 115)

    for r in results:
        succ_str = "YES (EXPLOIT)" if r["succeeded"] else "NO (SECURE)"
        color_flag = "!" if r["succeeded"] else " "
        why_brief = r["why"][:35] + "..." if len(r["why"]) > 35 else r["why"]
        line = f"{r['attack_id']:32s} | {r['goal']:18s} | {r['mode']:12s} | {succ_str:11s} | {r['cedar_blocks']:20s} | {why_brief}"
        print(line)

    print("=" * 115)

    # Compute Statistics
    unprotected_runs = [r for r in results if r["mode"] == "unprotected"]
    protected_runs = [r for r in results if r["mode"] == "protected"]

    unprotected_exploits = sum(1 for r in unprotected_runs if r["succeeded"])
    protected_exploits = sum(1 for r in protected_runs if r["succeeded"])

    print(f"\nUnprotected Mode: {unprotected_exploits}/{len(unprotected_runs)} attacks succeeded.")
    print(f"Protected Mode:   {protected_exploits}/{len(protected_runs)} attacks succeeded (CartGuard defended {len(protected_runs) - protected_exploits}/{len(protected_runs)}).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run CartGuard attack scenarios from CLI")
    parser.add_argument("--attack", default="all", help="Attack ID or 'all'")
    parser.add_argument("--mode", default="both", choices=["both", "unprotected", "protected", "replay"])
    parser.add_argument("--model", default=os.getenv("CARTGUARD_MODEL", "llama3.1:8b"))
    args = parser.parse_args()

    run_cli(
        selected_attack=args.attack,
        selected_mode=args.mode,
        model_name=args.model,
    )
