# S.C.A.R.
### Security Continuous Assessment & Remediation

An autonomous security pipeline that scans a target, finds 
vulnerabilities, generates patches with an LLM, and opens a 
GitHub PR — all in under 90 seconds.

---

## How It Works
Target URL
│
▼
┌─────────────────────────────┐
│ RED TEAM │
│ Nuclei + httpx + katana │
│ Gitleaks + Bandit │
│ → 5 findings detected │
└─────────────┬───────────────┘
│ [all_findings]
▼
┌─────────────────────────────┐
│ BLUE TEAM │
│ LLM (Llama 3.3 70B) │
│ → generates code patches │
│ → opens GitHub PR │
└─────────────────────────────┘

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python, async) |
| Security Tools | Nuclei v3, httpx, katana, Gitleaks, Bandit |
| AI | OpenRouter → Llama 3.3 70B (free) |
| Frontend | Next.js 14, xterm.js, shadcn/ui, Tailwind |
| Streaming | Server-Sent Events (SSE) |
| Automation | GitHub API — auto PR creation |
| Runtime | Docker Compose (3 containers) |

---

## Prerequisites

- Docker + Docker Compose
- Git
- A free OpenRouter API key → https://openrouter.ai
- A GitHub fine-grained token with Contents + PR read/write scopes

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Vishvam-Tank/S.C.A.R.
cd S.C.A.R.

# 2. Configure
cp .env.example .env
# Edit .env and fill in your OPENROUTER_API_KEY, GITHUB_TOKEN,
# GITHUB_OWNER, GITHUB_REPO

# 3. Start everything
docker compose up --build

# 4. Open the dashboard
# http://localhost:3000
```

That's it. One command.

---

## Services

| Service | URL | Description |
|---|---|---|
| Frontend | http://localhost:3000 | Main dashboard |
| Backend API | http://localhost:8000 | FastAPI + SSE |
| Demo Target | http://localhost:5000 | Vulnerable Flask app |
| API Docs | http://localhost:8000/docs | Swagger UI |

---

## API Endpoints
- **GET /health** → system status (LLM + GitHub + model)
- **POST /scan/red** → Red Team only body: `{"target": "https://..."}`
- **POST /scan/blue** → Blue Team only body: `{"findings": [...]}`
- **POST /scan/full** → Full pipeline body: `{"target": "https://..."}`

All scan endpoints return `text/event-stream` (SSE).

---

## SSE Event Types

| Type | Phase | Description |
|---|---|---|
| `status` | Both | General status message |
| `tool_start` | Red | A tool is starting |
| `tool_complete` | Red | Tool finished, has findings |
| `tool_fallback` | Red | Tool used cached results |
| `red_team_complete` | Red | All tools done, findings array |
| `analysis_complete` | Blue | LLM patches generated |
| `pr_created` | Blue | GitHub PR opened |
| `pr_failed` | Blue | PR creation failed |
| `error` | Both | Pipeline error |
| `complete` | Both | Phase finished |

---

## Demo Target Vulnerabilities

The included Flask app has exactly 3 intentional vulnerabilities:

1. **Stripe live key exposed** in `static/bundle.js` (critical)
2. **Flask debug mode** enabled in production (medium)  
3. **Reflected XSS** in `/api/v1/login` endpoint (high)

---

## Project Structure
S.C.A.R./
├── docker-compose.yml ← Start everything here
├── .env.example ← Copy to .env and fill in
├── backend/
│ ├── Dockerfile
│ ├── main.py ← FastAPI app, 5 endpoints
│ ├── pipelines/
│ │ ├── red_team.py ← Orchestrates 5 security tools
│ │ └── blue_team.py ← LLM analysis + GitHub PR
│ ├── services/
│ │ ├── llm_client.py ← OpenRouter with 9-model fallback chain
│ │ └── github_service.py ← PyGithub PR creation
│ └── tools/
│ ├── nuclei_runner.py
│ ├── httpx_runner.py
│ ├── katana_runner.py
│ ├── gitleaks_runner.py
│ └── bandit_runner.py
├── scar-frontend/
│ ├── Dockerfile
│ ├── app/
│ │ ├── layout.tsx
│ │ └── page.tsx
│ ├── components/ ← Header, ScanForm, TerminalPanel,
│ │ ReportModal, PrBanner, FindingsSummary
│ ├── hooks/
│ │ └── useScanStream.ts ← SSE consumer hook
│ └── lib/
│ ├── api.ts
│ └── types.ts
└── scar-demo-target/
├── app.py ← Intentionally vulnerable Flask app
├── static/bundle.js ← Contains fake Stripe key
└── Dockerfile

---

## Local Dev (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt  # if exists, else pip install fastapi uvicorn ...
uvicorn main:app --reload --port 8000

# Frontend
cd scar-frontend
cp .env.local.example .env.local
npm install
npm run dev  # http://localhost:3001
```

---

## License

MIT