import os
import json
import asyncio
import aiohttp
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# CONFIRMED live for this account — pulled from /api/v1/models April 2026
FALLBACK_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "z-ai/glm-4.5-air:free",
    "openrouter/free",
]

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "SCAR Security Scanner",
}


async def chat_completion(messages: list[dict], temperature: float = 0.2) -> str:
    last_error = "No models attempted"
    async with aiohttp.ClientSession() as session:
        for model in FALLBACK_MODELS:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 4096,
            }
            try:
                async with session.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    headers=HEADERS,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=90),
                ) as resp:
                    body = await resp.text()
                    if resp.status == 200:
                        data = json.loads(body)
                        content = data["choices"][0]["message"]["content"]
                        if content and content.strip():
                            print(f"[LLM] SUCCESS: {model}", flush=True)
                            return content.strip()
                        last_error = f"{model} returned empty content"
                        continue
                    if resp.status in (404, 400, 503):
                        print(f"[LLM] {model} -> {resp.status}, skipping", flush=True)
                        last_error = f"HTTP {resp.status} on {model}"
                        continue
                    if resp.status == 429:
                        print(f"[LLM] {model} -> 429 rate limit, skipping", flush=True)
                        last_error = f"429 on {model}"
                        continue
                    last_error = f"HTTP {resp.status} on {model}: {body[:200]}"
                    continue
            except asyncio.TimeoutError:
                print(f"[LLM] {model} timed out, skipping", flush=True)
                last_error = f"Timeout on {model}"
                continue
            except aiohttp.ClientError as e:
                last_error = f"Network error on {model}: {e}"
                continue
    raise RuntimeError(f"All models failed. Last error: {last_error}")


async def health_check() -> bool:
    try:
        result = await chat_completion(
            [{"role": "user", "content": "Reply with the single word: ok"}],
            temperature=0.0,
        )
        return bool(result)
    except Exception as e:
        print(f"[LLM] health_check failed: {e}", flush=True)
        return False


async def analyze_findings(findings: list[dict]) -> dict:
    if not findings:
        return {"patches": [], "summary": "No findings to analyze."}

    findings_text = json.dumps(findings, indent=2)

    system_prompt = """You are a senior application security engineer.
You will receive a list of security findings from automated scanners.
For each finding, produce a concrete code patch to fix it.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "brief overall risk summary",
  "patches": [
    {
      "finding_id": "template-id from finding",
      "severity": "critical|high|medium|low",
      "title": "short title",
      "explanation": "why this is dangerous",
      "file": "relative path to file to fix",
      "patch": "the exact fixed code to write to that file"
    }
  ]
}

Do not include markdown, backticks, or any text outside the JSON object."""

    response = await chat_completion(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze these security findings and produce patches:\n\n{findings_text}"},
        ],
        temperature=0.1,
    )

    cleaned = response.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else parts[0]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(cleaned[start:end])
        raise RuntimeError(f"LLM returned non-JSON: {cleaned[:300]}")
