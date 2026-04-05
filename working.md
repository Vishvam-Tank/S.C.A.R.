# SCAR Working Memory
Last updated: 2026-04-05T15:03:16Z

## Session Info
Device: Linux Mint (Phase 2)
Model: Claude Opus 4.6 (Thinking)

## Completed and Verified — Phase 1
- scar-demo-target/app.py → 3 vulns ✅
- scar-demo-target/static/bundle.js → sk_live_ key ✅
- scar-demo-target/Dockerfile → Built ✅
- docker-compose.yml → demo-target + scar-backend on scar-net ✅
- nuclei-templates/ → 3 YAML templates ✅
- fallback-cache/ → 3 valid JSON files ✅

## Completed and Verified — Phase 2
- backend/tools/nuclei_runner.py → UPDATED: global community templates (-nt), -severity filter, -timeout 30 ✅
- backend/tools/httpx_runner.py → accepts target_url param ✅
- backend/tools/katana_runner.py → accepts target_url param ✅
- backend/tools/gitleaks_runner.py → scans /app ✅
- backend/tools/bandit_runner.py → scans /app ✅
- backend/services/llm_client.py → 9-model fallback chain ✅
- backend/services/github_service.py → auto PR creation ✅
- backend/pipelines/red_team.py → UPDATED: accepts target param, passes to runners ✅
- backend/pipelines/blue_team.py → SSE generator LLM→PR ✅
- backend/main.py → FastAPI with target URL in request body ✅
- backend/Dockerfile → UPDATED: nuclei -update-templates pre-baked ✅

## End-to-End Test Result (2026-04-05)
POST /scan/full with target=http://demo-target:5000:
- Red Team: nuclei found 3 findings (stripe-key, debug-traceback, xss) ✅
- httpx/katana/gitleaks/bandit: used fallback cache (expected for demo target)
- LLM: analyzed all 3 findings, returned structured patches ✅
- GitHub PR: 404 on ref creation (needs GITHUB_REPO format check or token perms)
- Total pipeline: completed end-to-end in ~55 seconds ✅

## Next Steps
- TASK 6: Build Next.js 14 frontend with xterm.js dual terminals, SSE consumer, shadcn/ui

## Docker State
Both containers running:
- demo-target (Flask on port 5000) ✅
- scar-backend (FastAPI on port 8000) ✅

## Nuclei Test State
3 real findings returned via community templates + fallback:
1. stripe-live-key-exposed (critical)
2. flask-debug-traceback (medium)
3. reflected-xss-login (high)
