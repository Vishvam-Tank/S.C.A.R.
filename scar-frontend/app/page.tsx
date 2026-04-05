"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getHealth } from "@/lib/api";
import { useScanStream } from "@/hooks/useScanStream";
import type { HealthResponse } from "@/lib/types";
import type { LogEntry } from "@/hooks/useScanStream";

// ── Health badge ────────────────────────────────────────────────────────────

function HealthBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const data = await getHealth();
        if (mounted) {
          setHealth(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to connect");
          setHealth(null);
        }
      }
    }

    poll();
    const id = setInterval(poll, 10_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (error) {
    return (
      <div className="border border-red-700 bg-red-950/50 rounded px-4 py-2 text-sm">
        <span className="text-red-400">● API Offline</span>
        <span className="text-zinc-500 ml-2">— {error}</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="border border-zinc-700 rounded px-4 py-2 text-sm text-zinc-500">
        Connecting...
      </div>
    );
  }

  return (
    <div className="border border-zinc-700 rounded px-4 py-2 text-sm flex flex-wrap gap-4">
      <span className="text-green-400">● API OK</span>
      <span>
        LLM:{" "}
        <span className={health.llm ? "text-green-400" : "text-red-400"}>
          {health.llm ? "ok" : "failed"}
        </span>
      </span>
      <span>
        GitHub:{" "}
        <span className={health.github ? "text-green-400" : "text-red-400"}>
          {health.github ? "ok" : "failed"}
        </span>
      </span>
      <span className="text-zinc-500">Model: {health.model}</span>
      <span className="text-zinc-500">Target: {health.default_target}</span>
    </div>
  );
}

// ── Scan form ───────────────────────────────────────────────────────────────

function ScanForm({
  onScan,
  disabled,
}: {
  onScan: (target: string) => void;
  disabled: boolean;
}) {
  const [target, setTarget] = useState("http://demo-target:5000");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = target.trim();
    if (!trimmed) {
      setValidationError("Target URL is required");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setValidationError("URL must start with http:// or https://");
      return;
    }
    setValidationError(null);
    onScan(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="https://target-url.com"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm
                     text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled}
          className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded text-sm font-semibold
                     hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {disabled ? "Scanning..." : "Run Full Scan"}
        </button>
      </div>
      {validationError && (
        <p className="text-red-400 text-xs">{validationError}</p>
      )}
    </form>
  );
}

// ── Log panel ───────────────────────────────────────────────────────────────

function LogPanel({
  title,
  entries,
  color,
}: {
  title: string;
  entries: LogEntry[];
  color: "red" | "blue";
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  const borderColor = color === "red" ? "border-red-800" : "border-blue-800";
  const headerBg = color === "red" ? "bg-red-950/50" : "bg-blue-950/50";
  const badge = color === "red" ? "🔴" : "🔵";

  return (
    <div className={`border ${borderColor} rounded flex flex-col h-80`}>
      <div className={`${headerBg} px-3 py-1.5 text-xs font-semibold border-b ${borderColor}`}>
        {badge} {title}
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-xs leading-relaxed bg-zinc-950">
        {entries.length === 0 && (
          <p className="text-zinc-600 italic">Waiting...</p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="py-0.5">
            <span className="text-zinc-600">[{entry.event.type}]</span>{" "}
            <span className="text-zinc-300">
              {entry.event.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Findings summary ────────────────────────────────────────────────────────

function FindingsSummary({
  allFindings,
  patches,
  prUrl,
}: {
  allFindings: Record<string, unknown>[];
  patches: Record<string, unknown>[];
  prUrl: string | null;
}) {
  if (allFindings.length === 0 && patches.length === 0 && !prUrl) {
    return null;
  }

  return (
    <div className="border border-zinc-700 rounded p-4 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">Summary</h3>

      {allFindings.length > 0 && (
        <div>
          <p className="text-xs text-zinc-400 mb-1">
            Findings: <span className="text-zinc-100">{allFindings.length}</span>
          </p>
          <pre className="text-xs bg-zinc-900 rounded p-2 overflow-x-auto max-h-40 overflow-y-auto text-zinc-400">
            {JSON.stringify(allFindings, null, 2)}
          </pre>
        </div>
      )}

      {patches.length > 0 && (
        <div>
          <p className="text-xs text-zinc-400 mb-1">
            Patches: <span className="text-zinc-100">{patches.length}</span>
          </p>
          <pre className="text-xs bg-zinc-900 rounded p-2 overflow-x-auto max-h-40 overflow-y-auto text-zinc-400">
            {JSON.stringify(patches, null, 2)}
          </pre>
        </div>
      )}

      {prUrl && (
        <div>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            🔗 View Pull Request →
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const {
    phase,
    logs,
    allFindings,
    patches,
    lastPrUrl,
    lastError,
    startScan,
    reset,
  } = useScanStream();

  const redLogs = logs.filter((l) => l.team === "red");
  const blueLogs = logs.filter((l) => l.team === "blue");

  const isRunning = phase === "red" || phase === "blue";

  const handleScan = useCallback(
    (target: string) => {
      startScan(target);
    },
    [startScan]
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">S.C.A.R.</h1>
          <p className="text-zinc-500 text-sm">
            Security Continuous Assessment &amp; Remediation
          </p>
        </div>
        {(phase === "done" || phase === "error") && (
          <button
            onClick={reset}
            className="text-xs text-zinc-400 hover:text-zinc-200 underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Health */}
      <HealthBadge />

      {/* Scan form */}
      <ScanForm onScan={handleScan} disabled={isRunning} />

      {/* Phase indicator */}
      {phase !== "idle" && (
        <div className="text-xs text-zinc-500">
          Phase:{" "}
          <span
            className={
              phase === "error"
                ? "text-red-400"
                : phase === "done"
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {phase.toUpperCase()}
          </span>
        </div>
      )}

      {/* Error */}
      {lastError && (
        <div className="border border-red-700 bg-red-950/50 rounded px-4 py-2 text-sm text-red-300">
          {lastError}
        </div>
      )}

      {/* Dual log panels */}
      {phase !== "idle" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LogPanel title="Red Team" entries={redLogs} color="red" />
          <LogPanel title="Blue Team" entries={blueLogs} color="blue" />
        </div>
      )}

      {/* Findings */}
      <FindingsSummary
        allFindings={allFindings}
        patches={patches}
        prUrl={lastPrUrl}
      />
    </main>
  );
}
