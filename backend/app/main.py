import json
import os
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from backend.app.scenario_runner import (
    ACTIVE_SESSIONS,
    load_attacks,
    run_scenario_stream,
)
from backend.app.stress import run_stress_test
from backend.app.tools import load_catalog

app = FastAPI(
    title="CartGuard API",
    description="Deterministic Security Layer for AI Shopping Agents Against Indirect Prompt Injection",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CARTGUARD_MODEL = os.getenv("CARTGUARD_MODEL", "llama3.1:8b")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")


class RunRequest(BaseModel):
    attack_id: str
    mode: str = "protected"  # "protected" | "unprotected" | "replay" | "simulated_unprotected" | "simulated_protected"
    session_id: Optional[str] = None
    replay: bool = False
    run_type: Optional[str] = None  # "live" | "replay" | "simulated"


class ApproveRequest(BaseModel):
    session_id: Optional[str] = None


@app.get("/api/health")
def get_health():
    return {
        "status": "ok",
        "service": "CartGuard API",
        "model": os.getenv("CARTGUARD_MODEL", CARTGUARD_MODEL),
        "ollama_host": os.getenv("OLLAMA_HOST", OLLAMA_HOST),
    }


@app.get("/api/catalog")
def get_catalog():
    return load_catalog()


@app.get("/api/attacks")
def get_attacks():
    return load_attacks()


@app.get("/api/run")
async def get_run(attack_id: str, mode: str = "protected", replay: bool = False, run_type: Optional[str] = None):
    """GET endpoint for EventSource browser compatibility."""
    if run_type == "simulated" or mode.startswith("simulated"):
        actual_mode = mode if mode.startswith("simulated") else f"simulated_{mode}"
    elif replay and not mode.startswith("replay"):
        actual_mode = f"replay_{mode}"
    else:
        actual_mode = mode

    async def event_generator():
        async for event in run_scenario_stream(
            attack_id=attack_id,
            mode=actual_mode,
            run_type=run_type,
        ):
            yield {
                "event": "message",
                "data": json.dumps(event),
            }

    return EventSourceResponse(event_generator())


@app.post("/api/run")
async def post_run(req: RunRequest):
    """Run an individual scenario and stream events via SSE."""
    if req.run_type == "simulated" or req.mode.startswith("simulated"):
        actual_mode = req.mode if req.mode.startswith("simulated") else f"simulated_{req.mode}"
    elif req.replay and not req.mode.startswith("replay"):
        actual_mode = f"replay_{req.mode}"
    else:
        actual_mode = req.mode

    async def event_generator():
        async for event in run_scenario_stream(
            attack_id=req.attack_id,
            mode=actual_mode,
            session_id=req.session_id,
            run_type=req.run_type,
        ):
            yield {
                "event": "message",
                "data": json.dumps(event),
            }

    return EventSourceResponse(event_generator())


class RunAllRequest(BaseModel):
    replay: bool = False


@app.post("/api/run-all")
async def post_run_all(req: Optional[RunAllRequest] = None):
    """Run all 10 attacks across both modes (unprotected and protected), streaming per-attack results."""
    replay = req.replay if req else False
    attacks = load_attacks()

    async def run_all_generator():
        for atk in attacks:
            atk_id = atk["id"]
            unprot_mode = "replay_unprotected" if replay else "unprotected"
            prot_mode = "replay_protected" if replay else "protected"

            # 1. Unprotected run
            yield {
                "event": "status",
                "data": json.dumps({"status": "starting", "attack_id": atk_id, "mode": "unprotected"}),
            }
            async for ev in run_scenario_stream(attack_id=atk_id, mode=unprot_mode):
                yield {"event": "message", "data": json.dumps(ev)}

            # 2. Protected run
            yield {
                "event": "status",
                "data": json.dumps({"status": "starting", "attack_id": atk_id, "mode": "protected"}),
            }
            async for ev in run_scenario_stream(attack_id=atk_id, mode=prot_mode):
                yield {"event": "message", "data": json.dumps(ev)}

        yield {
            "event": "complete",
            "data": json.dumps({"status": "all_runs_complete"}),
        }

    return EventSourceResponse(run_all_generator())


@app.post("/api/approve")
def post_approve(req: ApproveRequest = ApproveRequest()):
    """Set user_approved=True on the active session so pending checkout can proceed."""
    if req.session_id and req.session_id in ACTIVE_SESSIONS:
        sess = ACTIVE_SESSIONS[req.session_id]
        sess.cart.user_approved = True
        return {
            "success": True,
            "session_id": req.session_id,
            "message": "User approval granted for checkout",
        }

    if ACTIVE_SESSIONS:
        last_sid = list(ACTIVE_SESSIONS.keys())[-1]
        ACTIVE_SESSIONS[last_sid].cart.user_approved = True
        return {
            "success": True,
            "session_id": last_sid,
            "message": f"User approval granted for latest session ({last_sid})",
        }

    return {
        "success": False,
        "message": "No active cart session available to approve",
    }


@app.post("/api/stress")
def post_stress():
    """Run 200 adversarial calls directly through Cedar authorization and return report."""
    return run_stress_test(200)


FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")

