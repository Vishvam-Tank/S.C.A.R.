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

        try:
            stdout, _ = await asyncio.wait_for(
                process.communicate(), timeout=8
            )
            for line_str in stdout.decode("utf-8").splitlines():
                line_str = line_str.strip()
                if line_str:
                    try:
                        parsed = json.loads(line_str)
                        results.append(parsed)
                    except json.JSONDecodeError:
                        pass
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()

        return results

    except Exception:
        return []
