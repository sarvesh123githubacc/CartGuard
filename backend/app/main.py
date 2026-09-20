import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CartGuard API",
    description="Security layer for AI shopping agents against indirect prompt injection",
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

@app.get("/api/health")
def get_health():
    return {
        "status": "ok",
        "service": "CartGuard API",
        "model": CARTGUARD_MODEL,
        "ollama_host": OLLAMA_HOST,
    }
