import asyncio
import json


async def run_httpx(target_url: str) -> list[dict]:
    """Run httpx against a target URL and return parsed JSONL output."""
    try:
        process = await asyncio.create_subprocess_exec(
            "httpx",
            "-u", target_url,
            "-json", "-silent",
            "-status-code", "-title",
            "-tech-detect", "-content-length",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )

        results = []

        while True:
            line = await process.stdout.readline()
            if not line:
                break
            line_str = line.decode("utf-8").strip()
            if line_str:
                try:
                    parsed = json.loads(line_str)
                    results.append(parsed)
                except json.JSONDecodeError:
                    pass

        await process.wait()
        return results

    except Exception:
        return []
