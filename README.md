# CartGuard

**Security Layer for AI Shopping Agents Against Indirect Prompt Injection**  
*AWS "Build It" Track — 100% Local & Open Source*

---

## 🛡️ Problem & Solution

In autonomous AI commerce, sellers control product listings, reviews, and specs. Malicious sellers can embed indirect prompt injections (e.g., hidden HTML comments, zero-width text, prompt overrides) that trick naive shopping agents into draining wallets, purchasing unrequested items, or leaking sensitive data.

**CartGuard** introduces three defense-in-depth security layers:
1. **Quarantined Reader Agent (Strands SDK)**: Parses untrusted seller text with **zero tools** enabled, extracting only typed, schema-validated factual attributes.
2. **Shopper Agent (Strands SDK)**: Interacts with store tools (cart, checkout) using only validated facts—never seeing raw seller text.
3. **Cedar Policy Engine (`cedarpy`)**: A deterministic AWS Cedar policy layer authorizing every single tool call before execution, providing an un-bypassable backstop even if an agent's reasoning is compromised.

---

## 🏗️ Tech Stack

- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic, Strands Agents SDK (`strands-agents[ollama]`), `cedarpy`
- **Model**: Local Ollama (`llama3.1:8b` via `http://localhost:11434`)
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Framer Motion + Lucide React
- **Evaluation**: Side-by-side comparative simulation (Unprotected Agent vs. CartGuard)

---

## 📁 Directory Structure

```text
CartGuard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py              # FastAPI app & GET /api/health
│   ├── cedar/
│   │   └── policies.cedar       # Base Cedar authorization policies
│   ├── data/                    # Test attack scenarios and listings
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_health.py       # API health check test
│   │   ├── test_cedar_smoke.py  # Cedar policy evaluation test
│   │   └── test_strands_smoke.py# Strands + Ollama tool-calling smoke test
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # UI dashboard & health status
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts           # Proxies /api to localhost:8000
│   └── tailwind.config.js
├── scripts/
│   ├── start_backend.ps1 / .bat
│   ├── start_frontend.ps1 / .bat
│   ├── run_tests.ps1
│   └── start-dev.js
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Requirements
- Node.js 18+
- Python 3.11
- Ollama with model `llama3.1:8b` running locally:
  ```powershell
  ollama serve
  ollama pull llama3.1:8b
  ```

### 2. Run All Tests
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/run_tests.ps1
```
Or run individual tests:
```powershell
# Cedar policy smoke test
powershell -ExecutionPolicy Bypass -File ./scripts/run_tests.ps1 cedar

# Strands + Ollama tool-calling smoke test
powershell -ExecutionPolicy Bypass -File ./scripts/run_tests.ps1 strands
```

### 3. Start Development Servers
```powershell
# Start Backend
powershell -ExecutionPolicy Bypass -File ./scripts/start_backend.ps1

# Start Frontend
powershell -ExecutionPolicy Bypass -File ./scripts/start_frontend.ps1
```
- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/api/health`
