import os
import json
import logging
from typing import AsyncGenerator
import aiofiles
from dotenv import load_dotenv

from tools.nuclei_runner import run_nuclei
from tools.gitleaks_runner import run_gitleaks
from tools.bandit_runner import run_bandit
from tools.httpx_runner import run_httpx
from tools.katana_runner import run_katana

load_dotenv()

logger = logging.getLogger(__name__)

FALLBACK_CACHE_DIR = os.getenv("FALLBACK_CACHE_DIR", "/app/fallback-cache")


async def _load_fallback(tool_name: str) -> list[dict]:
    """Load pre-recorded findings from fallback cache."""
    try:
        filepath = os.path.join(FALLBACK_CACHE_DIR, f"{tool_name}.json")
        async with aiofiles.open(filepath, mode="r") as f:
            content = await f.read()
            content = content.strip()
            if not content:
                return []
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            return [parsed]
    except Exception:
        return []


async def run_red_team(target: str = None) -> AsyncGenerator[str, None]:
    """SSE generator that orchestrates all 5 security tool runners."""

    if target is None:
        target = os.getenv("TARGET_URL", "http://demo-target:5000")

    def _sse(payload: dict) -> str:
        return f"data: {json.dumps(payload)}\n\n"

    all_findings = []

    tools = [
        ("nuclei",   lambda: run_nuclei(target)),
        ("httpx",    lambda: run_httpx(target)),
        ("katana",   lambda: run_katana(target)),
        ("gitleaks", lambda: run_gitleaks("/app")),
        ("bandit",   lambda: run_bandit("/app")),
    ]

    try:
        # Step 1 — status
        yield _sse({
            "type": "status",
            "message": f"🔴 Red Team started. Target: {target}",
        })

        # Step 2 — run each tool
        for tool_name, tool_fn in tools:
            # a. yield before running
            yield _sse({
                "type": "tool_start",
                "tool": tool_name,
                "message": f"🔍 Running {tool_name}...",
            })

            results = []

            # b. call the tool runner
            try:
                results = await tool_fn()
            except Exception as e:
                logger.error("%s runner raised: %s", tool_name, e)
                results = []

            # c/d. yield results or fallback
            if results:
                yield _sse({
                    "type": "tool_complete",
                    "tool": tool_name,
                    "message": f"✅ {tool_name} found {len(results)} findings",
                    "findings": results,
                })
            else:
                fallback = await _load_fallback(tool_name)
                yield _sse({
                    "type": "tool_fallback",
                    "tool": tool_name,
                    "message": f"⚠️ {tool_name} used fallback cache",
                    "findings": fallback,
                })
                results = fallback

            # e. accumulate
            all_findings.extend(results)

        # Step 3 — red team complete
        yield _sse({
            "type": "red_team_complete",
            "message": f"🔴 Red Team done. Total findings: {len(all_findings)}",
            "all_findings": all_findings,
        })

        # Step 4 — complete
        yield _sse({
            "type": "complete",
            "message": "🔴 Red Team pipeline finished.",
        })

    except Exception as e:
        logger.error("Red Team pipeline crashed: %s", e)
        yield _sse({
            "type": "error",
            "message": f"💥 Red Team crashed: {str(e)}",
        })
        yield _sse({
            "type": "complete",
            "message": "🔴 Red Team pipeline finished.",
        })
