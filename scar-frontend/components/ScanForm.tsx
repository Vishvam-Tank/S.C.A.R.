"use client";

import { useState } from "react";
import type { ScanPhase } from "@/lib/types";

interface ScanFormProps {
  onScan: (target: string) => void;
  onReset: () => void;
  phase: ScanPhase;
}

export function ScanForm({ onScan, onReset, phase }: ScanFormProps) {
  const [target, setTarget] = useState("http://demo-target:5000");
  const [validationError, setValidationError] = useState<string | null>(null);

  const isRunning = phase === "red" || phase === "blue";
  const showReset = phase === "done" || phase === "error";

  const isValid = target.trim().startsWith("http://") || target.trim().startsWith("https://");

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
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setValidationError(null);
            }}
            placeholder="https://target.com"
            disabled={isRunning}
            className={`w-full bg-[#111111] border rounded px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#888888] focus:outline-none transition-shadow ${
              isValid && !isRunning
                ? "border-[#2a2a2a] focus:border-[#22c55e] focus:shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                : "border-[#2a2a2a] focus:border-[#888888]"
            } disabled:opacity-50`}
          />
        </div>
        <button
          type="submit"
          disabled={isRunning || !isValid}
          className="bg-[#e8e8e8] text-[#0d0d0d] px-6 py-3 rounded text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
        >
          {isRunning ? "Scanning..." : "Run Full Scan"}
        </button>
        {showReset && (
          <button
            type="button"
            onClick={onReset}
            className="bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a] px-6 py-3 rounded text-sm font-bold hover:text-[#e8e8e8] transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      {validationError && (
        <p className="text-[#ef4444] text-sm mt-1">{validationError}</p>
      )}
    </form>
  );
}
