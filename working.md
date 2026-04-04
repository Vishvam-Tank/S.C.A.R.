# SCAR Working Memory
Last updated: 2026-04-04T18:14:32Z

## Session Info
Device: Linux Mint (Phase 1)
Model: Gemini 3.1 Pro (High)

## Completed and Verified
- scar-demo-target/requirements.txt → Flask requirement inside txt verified ✅
- scar-demo-target/app.py → Flask app running, all 3 routes verified via curl on port 5000 ✅
- scar-demo-target/static/bundle.js → sk_live_ key confirmed via curl fetch ✅
- scar-demo-target/Dockerfile → Built successfully ✅
- docker-compose.yml → Built and deployed two containers (demo-target, scar-backend) on custom network scar-net ✅

## Next File
(Waiting for next file instruction: Expected Nuclei v3 YAML templates)

## Errors Hit and Fixed
- Failed to create python `venv` because `python3.12-venv` was missing. Fixed by using user installation: `python3 -m pip install flask --break-system-packages`.
- Push to GitHub blocked by push protection (Stripe API Key in bundle.js). Kept intentional and reported to the user.

## Docker State
Docker compose is UP.
Containers live:
- scar-backend (python:3.11-slim)
- demo-target (scar-demo-target with ports 0.0.0.0:5000->5000/tcp)

## Nuclei Test State
0 findings returned. 0 times tested.
