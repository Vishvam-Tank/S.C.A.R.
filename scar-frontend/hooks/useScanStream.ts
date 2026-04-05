"use client";

import { useCallback, useRef, useState } from "react";
import { startFullScan } from "@/lib/api";
import type { ScanPhase, SseEvent } from "@/lib/types";

// ── Types for log entries ───────────────────────────────────────────────────

export interface LogEntry {
  team: "red" | "blue";
  event: SseEvent;
  timestamp: number;
}

export interface ScanState {
  phase: ScanPhase;
  logs: LogEntry[];
  redEvents: SseEvent[];
  blueEvents: SseEvent[];
  allFindings: Record<string, unknown>[];
  patches: Record<string, unknown>[];
  lastPrUrl: string | null;
  lastError: string | null;
}

const INITIAL_STATE: ScanState = {
  phase: "idle",
  logs: [],
  redEvents: [],
  blueEvents: [],
  allFindings: [],
  patches: [],
  lastPrUrl: null,
  lastError: null,
};

// ── Red vs Blue team classification ─────────────────────────────────────────

const RED_TYPES = new Set([
  "tool_start",
  "tool_complete",
  "tool_fallback",
  "red_team_complete",
]);

const BLUE_TYPES = new Set([
  "analysis_failed",
  "analysis_complete",
  "pr_created",
  "pr_failed",
]);

function classifyTeam(event: SseEvent): "red" | "blue" {
  if (RED_TYPES.has(event.type)) return "red";
  if (BLUE_TYPES.has(event.type)) return "blue";
  // "status" and "complete" are contextual — we determine from message content
  if (event.message.includes("Red") || event.message.includes("🔴")) return "red";
  if (event.message.includes("Blue") || event.message.includes("🔵")) return "blue";
  return "red"; // default to red (first in pipeline)
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useScanStream() {
  const [state, setState] = useState<ScanState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const startScan = useCallback(async (targetUrl: string) => {
    // Cancel any existing stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset state and set phase
    setState({ ...INITIAL_STATE, phase: "red" });

    try {
      const res = await startFullScan(targetUrl);

      if (!res.ok) {
        setState((s) => ({
          ...s,
          phase: "error",
          lastError: `HTTP ${res.status}: ${res.statusText}`,
        }));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setState((s) => ({
          ...s,
          phase: "error",
          lastError: "No response body stream available",
        }));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        if (controller.signal.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          let event: SseEvent;
          try {
            event = JSON.parse(jsonStr) as SseEvent;
          } catch {
            continue; // skip malformed JSON
          }

          const team = classifyTeam(event);
          const entry: LogEntry = { team, event, timestamp: Date.now() };

          setState((prev) => {
            const next = { ...prev };
            next.logs = [...prev.logs, entry];

            if (team === "red") {
              next.redEvents = [...prev.redEvents, event];
            } else {
              next.blueEvents = [...prev.blueEvents, event];
            }

            // Track phase transitions
            if (event.type === "red_team_complete") {
              next.allFindings = (event as { all_findings: Record<string, unknown>[] }).all_findings ?? [];
            }

            if (event.type === "status" && event.message.includes("Blue")) {
              next.phase = "blue";
            }

            if (event.type === "analysis_complete") {
              next.patches = (event as { patches: Record<string, unknown>[] }).patches ?? [];
            }

            if (event.type === "pr_created") {
              next.lastPrUrl = (event as { pr_url: string }).pr_url ?? null;
            }

            if (event.type === "error") {
              next.phase = "error";
              next.lastError = event.message;
            }

            // Final "complete" from blue team means pipeline is done
            if (event.type === "complete" && team === "blue") {
              if (next.phase !== "error") next.phase = "done";
            }

            return next;
          });
        }
      }

      // If we finished reading without error, mark done
      setState((prev) => {
        if (prev.phase === "red" || prev.phase === "blue") {
          return { ...prev, phase: "done" };
        }
        return prev;
      });
    } catch (err: unknown) {
      if (controller.signal.aborted) return; // intentional cancel
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, phase: "error", lastError: message }));
    }
  }, []);

  return { ...state, startScan, reset };
}
