import os
import time
import asyncio
import logging
from github import Github, GithubException
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_OWNER = os.getenv("GITHUB_OWNER", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "")
FULL_REPO = f"{GITHUB_OWNER}/{GITHUB_REPO}"


def _sync_create_pr(patches: list[dict]) -> dict:
    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(FULL_REPO)

    default_branch = repo.default_branch
    sha = repo.get_branch(default_branch).commit.sha
    new_branch_name = f"scar-patch-{int(time.time())}"
    repo.create_git_ref(ref=f"refs/heads/{new_branch_name}", sha=sha)

    count = len(patches)
    body_lines = [
        "## 🔒 SCAR Auto-Patch Report\n",
        f"**{count} vulnerabilities** identified and patched.\n",
        "---\n",
    ]

    for patch in patches:
        finding_id = patch.get("finding_id", "unknown")
        severity = patch.get("severity", "unknown")
        explanation = patch.get("explanation", "No explanation provided.")
        code_patch = patch.get("patch", "# No patch provided")
        body_lines.append(f"### `{finding_id}`\n")
        body_lines.append(f"**Severity:** {severity}\n")
        body_lines.append(f"{explanation}\n")
        body_lines.append(f"```python\n{code_patch}\n```\n")
        body_lines.append("---\n")

    pr = repo.create_pull(
        title=f"🔒 SCAR Auto-Patch: {count} vulnerabilities fixed",
        body="\n".join(body_lines),
        head=new_branch_name,
        base=default_branch,
    )
    return {
        "pr_url": pr.html_url,
        "pr_number": pr.number,
        "branch": new_branch_name,
        "status": "created",
    }


async def create_patch_pr(patches: list[dict]) -> dict:
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _sync_create_pr, patches)
        return result
    except Exception as e:
        logger.error("Failed to create patch PR: %s", e)
        return {
            "pr_url": None,
            "pr_number": None,
            "branch": None,
            "status": "failed",
            "error": str(e),
        }


async def health_check() -> bool:
    try:
        loop = asyncio.get_event_loop()
        def _check():
            g = Github(GITHUB_TOKEN)
            repo = g.get_repo(FULL_REPO)
            return repo.full_name is not None
        result = await loop.run_in_executor(None, _check)
        return result
    except Exception as e:
        logger.error("GitHub health check failed: %s", e)
        return False
