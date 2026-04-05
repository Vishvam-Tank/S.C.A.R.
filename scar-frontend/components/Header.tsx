"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="group relative flex items-center justify-center">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          ok ? "bg-[#22c55e]" : "bg-[#ef4444]"
        }`}
      />
      <div className="absolute top-full mt-2 hidden group-hover:block z-50 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e8e8e8] text-xs px-2 py-1 rounded whitespace-nowrap">
        {label}: {ok ? "OK" : "Failed"}
      </div>
    </div>
  );
}

export function Header() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [apiOk, setApiOk] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const data = await getHealth();
        if (mounted) {
          setHealth(data);
          setApiOk(true);
        }
      } catch {
        if (mounted) {
          setApiOk(false);
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

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#0d0d0d] border-b border-[#2a2a2a]">
      <div className="flex items-center gap-3">
        {/* Simple geometric mark */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-sans font-bold text-lg tracking-tight text-[#e8e8e8]">
          S.C.A.R.
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Health Badge */}
        <div className="flex items-center gap-3 bg-[#111111] border border-[#2a2a2a] rounded px-3 py-1.5 cursor-default">
          <span className="text-xs text-[#888888] uppercase tracking-wider font-semibold mr-1">
            System Status
          </span>
          <Dot ok={apiOk} label="API" />
          <Dot ok={health?.llm ?? false} label="LLM" />
          <Dot ok={health?.github ?? false} label="GitHub" />
        </div>
      </div>
    </header>
  );
}
