import json
import logging
from typing import AsyncGenerator

from services.llm_client import analyze_findings
from services.github_service import create_patch_pr

logger = logging.getLogger(__name__)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def run_blue_team(findings: list[dict]) -> AsyncGenerator[str, None]:
    """SSE generator: LLM analysis → GitHub PR creation."""

    # ── Step 1: Boot status ──────────────────────────────────────────────────
    yield _sse({
        "type": "status",
        "message": "🔵 Blue Team started. Analyzing findings with LLM...",
    })

    if not findings:
        yield _sse({
            "type": "analysis_failed",
            "message": "⚠️ No findings passed to Blue Team — nothing to analyze.",
            "patches": [],
        })
        yield _sse({"type": "complete", "message": "🔵 Blue Team pipeline finished."})
        return

    # ── Step 2: LLM analysis ─────────────────────────────────────────────────
    try:
        result = await analyze_findings(findings)
    except Exception as e:
        logger.error("analyze_findings raised: %s", e, exc_info=True)
        yield _sse({
            "type": "analysis_failed",
            "message": f"⚠️ LLM call crashed: {str(e)}",
            "patches": [],
        })
        yield _sse({"type": "complete", "message": "🔵 Blue Team pipeline finished."})
        return

    # Surface the real LLM error — no more silent fallback
    if "error" in result:
        yield _sse({
            "type": "analysis_failed",
            "message": f"⚠️ LLM error: {result['error']}",
            "patches": [],
        })
        yield _sse({"type": "complete", "message": "🔵 Blue Team pipeline finished."})
        return

    patches = result.get("patches", [])

    if not patches:
        yield _sse({
            "type": "analysis_failed",
            "message": "⚠️ LLM returned 0 patches. Model may have returned empty response.",
            "patches": [],
        })
        yield _sse({"type": "complete", "message": "🔵 Blue Team pipeline finished."})
        return

    yield _sse({
        "type": "analysis_complete",
        "message": f"✅ LLM analyzed {len(patches)} finding(s)",
        "patches": patches,
    })

    # ── Step 3: GitHub PR ────────────────────────────────────────────────────
    yield _sse({
        "type": "status",
        "message": "🔧 Creating GitHub PR with patches...",
    })

    try:
        pr_result = await create_patch_pr(patches)
    except Exception as e:
        logger.error("create_patch_pr raised: %s", e, exc_info=True)
        yield _sse({
            "type": "pr_failed",
            "message": f"❌ PR creation crashed: {str(e)}",
            "pr_url": None,
        })
        yield _sse({"type": "complete", "message": "🔵 Blue Team pipeline finished."})
        return

    if pr_result.get("status") == "created":
        yield _sse({
            "type": "pr_created",
            "message": "🎉 PR created successfully!",
            "pr_url": pr_result.get("pr_url"),
            "pr_number": pr_result.get("pr_number"),
            "branch": pr_result.get("branch"),
        })
    else:
        yield _sse({
            "type": "pr_failed",
            "message": f"❌ PR creation failed: {pr_result.get('error', 'unknown error')}",
            "pr_url": None,
        })

    # ── Step 4: Done ─────────────────────────────────────────────────────────
    yield _sse({"type": "complete", "message": "🔵 Blue Team pipeline finished."})