# SCAR Working Memory
Last updated: 2026-04-04T19:37:36Z

## Session Info
Device: Linux Mint (Phase 1)
Model: Gemini 3.1 Pro (High)

## Completed and Verified
- scar-demo-target/requirements.txt → Flask requirement inside txt verified ✅
- scar-demo-target/app.py → Flask app running, all 3 routes verified via curl on port 5000 ✅
- scar-demo-target/static/bundle.js → sk_live_ key confirmed via curl fetch ✅
- scar-demo-target/Dockerfile → Built successfully ✅
- docker-compose.yml → Built and deployed two containers (demo-target, scar-backend) on custom network scar-net ✅
- nuclei-templates/stripe-key.yaml → Created and tested ✅
- nuclei-templates/xss-login.yaml → Created and tested ✅
- nuclei-templates/debug-traceback.yaml → Created and tested ✅
- fallback-cache/stripe-key.json → Created and verified as valid JSON ✅
- fallback-cache/xss-login.json → Created and verified as valid JSON ✅
- fallback-cache/debug-traceback.json → Created and verified as valid JSON ✅

## Next File
(Waiting for next instruction on tool runners)

## Errors Hit and Fixed
- Failed to create python `venv` because `python3.12-venv` was missing. Fixed by using user installation.
- Push to GitHub blocked by push protection (Stripe API Key in bundle.js). Kept intentional and reported to the user.
- Nuclei docker image `v3.3.7` not found, used `v3.3.8`. Docker-compose generated `scar_scar-net` instead of `scar-net`, adjusted the network name in the docker run command to `scar_scar-net`.

## Docker State
Docker compose is UP.
Containers live:
- scar-backend (python:3.11-slim)
- demo-target (scar-demo-target with ports 0.0.0.0:5000->5000/tcp)

## Nuclei Test State
3 findings returned:
1. `reflected-xss-login`
2. `stripe-live-key-exposed`
3. `flask-debug-traceback`
Tested exactly 1 time.
