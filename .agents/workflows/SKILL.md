---
description: 
---

---
name: scar-async-checker
description: Use this when writing any Python function that runs a tool (nuclei, katana, httpx, gitleaks, bandit). Ensures all subprocess calls are non-blocking async.
---

## Goal
Ensure every tool runner in backend/tools/ uses asyncio.create_subprocess_exec.

## Rules
1. Never use subprocess.run — always asyncio.create_subprocess_exec
2. The function must be async def
3. Read stdout line by line, not all at once
4. Wrap everything in try/except — return empty list on failure, never crash

## Pattern to Follow
async def run_tool(target: str) -> list:
    try:
        proc = await asyncio.create_subprocess_exec(
            "tool-binary", "-flag", target,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        results = []
        async for line in proc.stdout:
            line = line.decode().strip()
            if line:
                results.append(json.loads(line))
        return results
    except Exception:
        return []