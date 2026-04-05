import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.pipelines.red_team import run_red_team
from backend.pipelines.blue_team import run_blue_team
from backend.services.llm_client import health_check as llm_health_check
from backend.services.github_service import health_check as github_health_check

load_dotenv()

app = FastAPI(title="SCAR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    findings: list[dict]


@app.get("/")
async def root():
    return JSONResponse({
        "name": "SCAR API",
        "version": "1.0.0",
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
        "target": os.getenv("TARGET_URL", "http://demo-target:5000"),
    })


@app.post("/scan/red")
async def scan_red():
    return StreamingResponse(
        run_red_team(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/scan/blue")
async def scan_blue(request: ScanRequest):
    return StreamingResponse(
        run_blue_team(request.findings),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/scan/full")
async def scan_full():
    async def _full_pipeline():
        all_findings = []

        try:
            # Phase 1: Red Team — stream all events, capture findings
            async for sse_line in run_red_team():
                yield sse_line

                # Parse the SSE data line to capture all_findings
                if sse_line.startswith("data: "):
                    try:
                        payload = json.loads(sse_line[6:].strip())
                        if payload.get("type") == "red_team_complete":
                            all_findings = payload.get("all_findings", [])
                    except json.JSONDecodeError:
                        pass

            # Phase 2: Blue Team — feed red team findings into LLM + PR
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
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
