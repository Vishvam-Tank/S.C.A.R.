# SCAR Working Memory
Last updated: 2026-04-04T23:54:58Z

## Session Info
Device: Linux Mint (Phase 2)
Model: Claude Opus 4.6 (Thinking)

## Completed and Verified — Phase 1
- scar-demo-target/requirements.txt → Flask requirement verified ✅
- scar-demo-target/app.py → Flask app running, all 3 routes verified via curl ✅
- scar-demo-target/static/bundle.js → sk_live_ key confirmed ✅
- scar-demo-target/Dockerfile → Built successfully ✅
- docker-compose.yml → Two containers on scar-net ✅
- nuclei-templates/stripe-key.yaml → Tested ✅
- nuclei-templates/xss-login.yaml → Tested ✅
- nuclei-templates/debug-traceback.yaml → Tested ✅
- fallback-cache/stripe-key.json → Valid JSON ✅
- fallback-cache/xss-login.json → Valid JSON ✅
- fallback-cache/debug-traceback.json → Valid JSON ✅
- backend/tools/nuclei_runner.py → Syntax verified ✅
- backend/tools/__init__.py → Package init ✅
- backend/Dockerfile → All binaries (nuclei v3.3.7, httpx v1.6.10, katana v1.1.0, gitleaks v8.18.4) ✅
- docker-compose.yml (update) → scar-backend builds from backend/Dockerfile ✅

## Completed and Verified — Phase 2
- backend/services/__init__.py → Package init ✅
- backend/services/llm_client.py → async analyze_findings + health_check, OpenRouter via openai SDK, fallback handling ✅
- backend/services/github_service.py → async create_patch_pr + health_check, PyGithub via run_in_executor, error fallback ✅
- backend/pipelines/__init__.py → Package init ✅
- backend/pipelines/blue_team.py → async SSE generator run_blue_team, wires LLM → GitHub PR, full error handling ✅
- backend/pipelines/red_team.py → async SSE generator run_red_team, orchestrates all 5 tool runners (nuclei → httpx → katana → gitleaks → bandit), per-tool fallback from cache, grep checks passed ✅

## Next File
- 4 remaining tool runner stubs needed: gitleaks_runner.py, bandit_runner.py, httpx_runner.py, katana_runner.py (red_team.py imports them)
- Then FastAPI routes

## Errors Hit and Fixed
- Phase 1: venv creation failed (python3.12-venv missing), push protection blocked Stripe key, nuclei v3.3.7 image not found (used v3.3.8), docker network name mismatch (scar_scar-net)
- Phase 2: grep -n "fallback" failed case-sensitive on llm_client.py because variable is FALLBACK_RESPONSE — confirmed present with case-insensitive check

## Docker State
Docker compose is running the prior build. scar-backend needs `docker compose up --build` to pick up the new Dockerfile.

## Nuclei Test State
3 findings returned (Phase 1 verified):
1. reflected-xss-login
2. stripe-live-key-exposed
3. flask-debug-traceback
Tested exactly 1 time.
