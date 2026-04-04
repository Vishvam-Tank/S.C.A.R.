import asyncio
import json
import aiofiles


async def run_bandit(scan_path: str) -> list[dict]:
    """Run bandit and return the results list from its JSON report."""
    try:
        process = await asyncio.create_subprocess_exec(
            "bandit", "-r", scan_path,
            "-f", "json",
            "-o", "/tmp/bandit_out.json",
            "--exit-zero",
            "-q",
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await process.wait()

        async with aiofiles.open("/tmp/bandit_out.json", mode="r") as f:
            content = await f.read()
            content = content.strip()
            if not content:
                return []
            parsed = json.loads(content)
            return parsed.get("results", [])

    except Exception:
        return []
