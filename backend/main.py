import os
import json
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv

from pipelines.red_team import run_red_team
from pipelines.blue_team import run_blue_team
from services.llm_client import health_check as llm_health_check
from services.github_service import health_check as github_health_check

load_dotenv(dotenv_path="/run/secrets/.env", override=False)
load_dotenv(override=False)  # fallback to any .env in PATH


DEFAULT_TARGET = os.getenv("TARGET_URL", "http://demo-target:5000")

app = FastAPI(title="SCAR API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3002",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ────────────────────────────────────────────────────────────

class RedScanRequest(BaseModel):
    target: str = DEFAULT_TARGET

class BlueScanRequest(BaseModel):
    findings: list[dict]

class FullScanRequest(BaseModel):
    target: str = DEFAULT_TARGET


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return JSONResponse({
        "name": "SCAR API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": ["/health", "/scan/red", "/scan/blue", "/scan/full"],
    })


@app.get("/health")
async def health():
    llm_ok = await llm_health_check()
    github_ok = await github_health_check()
    return JSONResponse({
        "status": "ok",
        "llm": llm_ok,
        "github": github_ok,
        "model": os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free"),
        "default_target": DEFAULT_TARGET,
    })


@app.post("/scan/red")
async def scan_red(request: RedScanRequest):
    return StreamingResponse(
        run_red_team(request.target),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/scan/blue")
async def scan_blue(request: BlueScanRequest):
    return StreamingResponse(
        run_blue_team(request.findings),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/scan/full")
async def scan_full(request: FullScanRequest):
    async def _full_pipeline():
        all_findings = []
        try:
            async for sse_line in run_red_team(request.target):
                yield sse_line
                if sse_line.startswith("data: "):
                    try:
                        payload = json.loads(sse_line[6:].strip())
                        if payload.get("type") == "red_team_complete":
                            all_findings = payload.get("all_findings", [])
                    except json.JSONDecodeError:
                        pass

            async for sse_line in run_blue_team(all_findings):
                yield sse_line

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        _full_pipeline(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
