import json
import logging
from typing import AsyncGenerator
from backend.services.llm_client import analyze_findings
from backend.services.github_service import create_patch_pr

logger = logging.getLogger(__name__)


async def run_blue_team(findings: list[dict]) -> AsyncGenerator[str, None]:
    """SSE generator that orchestrates LLM analysis → GitHub PR creation."""

    def _sse(payload: dict) -> str:
        return f"data: {json.dumps(payload)}\n\n"

    try:
        # Step 1 — status
        yield _sse({
            "type": "status",
            "message": "🔵 Blue Team started. Analyzing findings with LLM...",
        })

        # Step 2 — LLM analysis
        result = await analyze_findings(findings)
        patches = result.get("patches", [])

        if not patches or "error" in result:
            yield _sse({
                "type": "analysis_failed",
                "message": "⚠️ LLM analysis failed. Using fallback mode.",
                "patches": [],
            })
            # Final event before early return
            yield _sse({
                "type": "complete",
                "message": "🔵 Blue Team pipeline finished.",
            })
            return

        yield _sse({
            "type": "analysis_complete",
            "message": f"✅ LLM analyzed {len(patches)} findings",
            "patches": patches,
        })

        # Step 3 — status
        yield _sse({
            "type": "status",
            "message": "🔧 Creating GitHub PR with patches...",
        })

        # Step 4 — GitHub PR
        pr_result = await create_patch_pr(patches)

        if pr_result["status"] == "created":
            yield _sse({
                "type": "pr_created",
                "message": "🎉 PR created successfully!",
                "pr_url": pr_result["pr_url"],
                "pr_number": pr_result["pr_number"],
                "branch": pr_result["branch"],
            })
        else:
            yield _sse({
                "type": "pr_failed",
                "message": f"❌ PR creation failed: {pr_result.get('error', 'unknown')}",
                "pr_url": None,
            })

        # Step 5 — complete
        yield _sse({
            "type": "complete",
            "message": "🔵 Blue Team pipeline finished.",
        })

    except Exception as e:
        logger.error("Blue Team pipeline crashed: %s", e)
        yield _sse({
            "type": "error",
            "message": f"💥 Blue Team crashed: {str(e)}",
        })
        yield _sse({
            "type": "complete",
            "message": "🔵 Blue Team pipeline finished.",
        })
