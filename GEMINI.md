---
trigger: always_on
---

# SCAR Phase 1 — Infrastructure Rules (Linux Mint)

## My Job (Phase 1 Only)
Build the firing range. That means:
- Vulnerable Flask demo target (intentionally broken)
- Docker + docker-compose setup
- 3 Nuclei v3 YAML templates
- 5 async tool runner stubs
- 3 fallback cache JSON files
NO FastAPI routes. NO Next.js. NO SSE. NO frontend. Stay in my lane.

## The 3 Vulnerabilities — INTENTIONAL, Never Fix Them
1. Stripe key hardcoded in scar-demo-target/static/bundle.js → sk_live_51ABCDEFGhardcodedFakeKey123456
2. Reflected XSS at /api/v1/login?username= → no sanitization ever
3. Debug traceback at /api/debug → exception raised on purpose, debug=True
These are the TARGET. Do not sanitize, do not handle exceptions, do not add security of any kind.

## Docker Rules — Phase 1 Critical
- Base image: python:3.11-slim always — never python:3.11 or python:latest
- Pin ALL binary versions exactly:
  nuclei v3.3.7 | katana v1.1.0 | httpx v1.6.10 | gitleaks v8.18.4
- All Go binaries: linux_amd64 zip from GitHub releases, unzipped to /usr/local/bin/
- Inside Docker, Flask app is at http://demo-target:5000 — NEVER localhost:5000
- Both containers must be on scar-net bridge network
- Never suggest running Docker with --parallel

## Nuclei v3 YAML Rules
- Use correct v3 format: info block + http block (not requests) + matchers block
- Single URL scan: always use -u flag
- Output: always -jsonl flag
- Templates volume path inside container: /app/nuclei-templates/
- Never guess or invent Nuclei v3 YAML syntax — use Context7 MCP to fetch real docs

## Tool Runner Rules (Files 8–12)
- Every runner must be async def using asyncio.create_subprocess_exec
- Never use subprocess.run, subprocess.Popen, or os.system
- Every runner must catch ALL exceptions and return empty list/dict — never crash
- These are STUBS only — they need to run without errors, not be perfect

## Code Generation Behavior
- Write every file COMPLETELY — never truncate with "rest of code here"
- Always label the full file path above every code block
- When a bug appears: state root cause first, then exact fix
- Use Context7 MCP to verify Nuclei v3 YAML syntax before generating templates
- Use Sequential Thinking for any multi-file task

## Git Rules
- Update memory-friend.md after every completed file, then commit it
- Only commit after something is verified working in the browser
- Never push broken state
- Commit message format: feat: File 3 Dockerfile complete

## Handoff Standard
Phase 1 is NOT done until:
- nuclei returns exactly 3 JSON findings
- Tested 10 consecutive times
- All 5 tool runner imports work inside Docker without errors
- All 3 fallback JSON files are valid JSON





## Working Memory — Auto-Update After Every File

After completing AND verifying every single file, you MUST automatically update 
working.md in the project root without being asked. No exceptions.

If working.md does not exist yet, create it first.

The file must always contain:

# SCAR Working Memory
Last updated: [current timestamp]

## Session Info
Device: Linux Mint (Phase 1)
Model: [model currently being used]

## Completed and Verified
[List every file with full path and what was verified — e.g.]
- scar-demo-target/app.py → Flask running, all 3 routes verified in browser ✅
- scar-demo-target/static/bundle.js → sk_live_ key confirmed in browser ✅

## Next File
[Exact name and path of the NEXT file not yet started]

## Errors Hit and Fixed
[Any error encountered and how it was resolved — never leave this blank if an error occurred]

## Docker State
[Is docker compose up running? Which containers are live?]

## Nuclei Test State
[How many findings returned on last test? How many times tested?]

Rules for updating:
- Update IMMEDIATELY after each file is saved and verified — not at the end of session
- Never skip updating even for tiny changes
- Commit working.md to git after every update:
  git add working.md && git commit -m "progress: [filename] complete" && git push
- A new agent reading only this file must be able to continue with zero questions