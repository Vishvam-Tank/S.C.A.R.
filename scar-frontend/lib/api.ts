import type { HealthResponse } from "./types";

// Use the public API URL (set at build time for Docker)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** GET /health — check backend, LLM, and GitHub status */
export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

/**
 * POST /scan/full — start a full Red+Blue pipeline.
 * Returns the raw Response so the caller can consume the SSE body stream.
 *
 * Backend body contract (from main.py FullScanRequest):
 *   { "target": string }           ← field name is "target", NOT "target_url"
 */
export function startFullScan(target: string): Promise<Response> {
  return fetch(`${API_BASE}/scan/full`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target }),
  });
}
