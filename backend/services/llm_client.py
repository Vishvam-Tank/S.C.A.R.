import os
import json
import logging
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

FALLBACK_RESPONSE = {"patches": [], "error": "LLM response was not valid JSON"}

SYSTEM_PROMPT = (
    "You are a senior security engineer. Analyze these security "
    "findings from a Nuclei scan. For each finding, provide:\n"
    "1. A plain-English explanation of the vulnerability\n"
    "2. The exact severity level\n"
    "3. A concrete code patch to fix it\n"
    "Return a valid JSON object with key 'patches' containing "
    "a list. Each item must have: "
    "finding_id (str), explanation (str), severity (str), patch (str)"
)


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
        default_headers={
            "HTTP-Referer": "scar-mvp",
            "X-Title": "SCAR",
        },
    )


async def analyze_findings(findings: list[dict]) -> dict:
    """Send Nuclei findings to the LLM and return structured patches."""
    try:
        client = _get_client()

        user_prompt = (
            "Analyze the following Nuclei scan findings and return "
            "your response as a valid JSON object:\n\n"
            + json.dumps(findings, indent=2)
        )

        response = await client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content.strip()

        try:
            result = json.loads(content)
            return result
        except json.JSONDecodeError:
            logger.error("LLM response was not valid JSON: %s", content[:200])
            return dict(FALLBACK_RESPONSE)

    except Exception as exc:
        logger.error("OpenRouter API call failed: %s", exc)
        return dict(FALLBACK_RESPONSE)


async def health_check() -> bool:
    """Ping the LLM with a minimal message; return True if it replies ok."""
    try:
        client = _get_client()

        response = await client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[
                {"role": "user", "content": "Reply with: ok"},
            ],
            temperature=0,
            max_tokens=10,
        )

        content = response.choices[0].message.content.strip().lower()
        return "ok" in content

    except Exception as exc:
        logger.error("Health check failed: %s", exc)
        return False
