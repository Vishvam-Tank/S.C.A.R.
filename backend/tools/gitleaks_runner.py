import asyncio
import json
import aiofiles


async def run_gitleaks(scan_path: str) -> list[dict]:
    """Run gitleaks detect and return findings as a list of dicts."""
    try:
        process = await asyncio.create_subprocess_exec(
            "gitleaks", "detect",
            "--source", scan_path,
            "--report-format", "json",
            "--report-path", "/tmp/gitleaks_out.json",
            "--no-git",
            "--exit-code", "0",
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await process.wait()

        async with aiofiles.open("/tmp/gitleaks_out.json", mode="r") as f:
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
