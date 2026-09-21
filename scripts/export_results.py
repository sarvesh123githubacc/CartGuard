import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.stress import run_stress_test
from backend.app.scenario_runner import load_attacks, run_scenario_sync

attacks = load_attacks()
recorded_dir = Path("backend/data/recorded")

# 1. Live Model / Replay Evaluations
live_results = []
for atk in attacks:
    atk_id = atk["id"]
    for mode in ["unprotected", "protected"]:
        rec_file = recorded_dir / f"{atk_id}_{mode}.json"
        eval_ev = None
        cart_ev = None
        cedar_blocks = []
        event_count = 0
        if rec_file.exists():
            with open(rec_file, "r", encoding="utf-8") as f:
                payload = json.load(f)
            events = payload.get("events", []) if isinstance(payload, dict) and "events" in payload else payload
            if isinstance(events, list):
                clean_events = []
                for e in events:
                    if isinstance(e, dict):
                        clean_events.append(e)
                    elif isinstance(e, str):
                        try:
                            clean_events.append(json.loads(e))
                        except Exception:
                            pass
                events = clean_events
                event_count = len(events)
                eval_ev = next((e for e in events if e.get("type") == "evaluation"), None)
                cart_ev = next((e for e in reversed(events) if e.get("type") == "cart_update"), None)
                cedar_blocks = [
                    e.get("rule")
                    for e in events
                    if e.get("type") == "cedar_decision" and e.get("decision") == "DENY"
                ]

        live_results.append({
            "attack_id": atk_id,
            "attack_name": atk["name"],
            "vector": atk["vector"],
            "goal": atk["attacker_goal"],
            "mode": mode,
            "run_type": "replay_baseline",
            "attack_succeeded": eval_ev.get("attack_succeeded") if eval_ev else False,
            "evaluation_reason": eval_ev.get("why") if eval_ev else "Adhered to user intent",
            "cedar_blocks": cedar_blocks,
            "cart": cart_ev.get("cart") if cart_ev else None,
            "event_count": event_count,
        })

# 2. Simulated: worst case, agent fully compromised (Scripted Attacker Actions)
simulated_results = []
for atk in attacks:
    atk_id = atk["id"]
    for sim_mode in ["simulated_unprotected", "simulated_protected"]:
        events = run_scenario_sync(atk_id, sim_mode)
        eval_ev = next((e for e in events if e.get("type") == "evaluation"), None)
        cart_ev = next((e for e in reversed(events) if e.get("type") == "cart_update" or e.get("type") == "final_cart"), None)
        cedar_blocks = [
            e.get("rule")
            for e in events
            if e.get("type") == "cedar_decision" and e.get("decision") == "DENY"
        ]

        target_mode = "unprotected" if "unprotected" in sim_mode else "protected"
        simulated_results.append({
            "attack_id": atk_id,
            "attack_name": atk["name"],
            "vector": atk["vector"],
            "goal": atk["attacker_goal"],
            "mode": target_mode,
            "run_type": "simulated",
            "label": "Simulated: worst case, agent fully compromised",
            "attack_succeeded": eval_ev.get("attack_succeeded") if eval_ev else False,
            "evaluation_reason": eval_ev.get("why") if eval_ev else "Adhered to user intent",
            "cedar_blocks": cedar_blocks,
            "cart": cart_ev.get("cart") if cart_ev else None,
            "event_count": len(events),
        })

stress_report = run_stress_test(200)

final_output = {
    "model": "llama3.1:8b",
    "attacks_count": len(attacks),
    "live_model_evaluations": live_results,
    "simulated_compromised_evaluations": simulated_results,
    "simulated_agent_label": "Simulated: worst case, agent fully compromised",
    "stress_test_report": stress_report,
}

out_path = Path("results/run_all_output.json")
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(final_output, f, indent=2)

print("Exported separated results to results/run_all_output.json successfully!")
