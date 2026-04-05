"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import type { LogEntry } from "@/hooks/useScanStream";
import type {
  ToolStartEvent,
  ToolCompleteEvent,
  ToolFallbackEvent,
  RedTeamCompleteEvent,
  AnalysisCompleteEvent,
  PrCreatedEvent,
} from "@/lib/types";

interface TerminalPanelProps {
  title: string;
  theme: "red" | "blue";
  entries: LogEntry[];
}

// Ensure string is safe from injecting unintended ANSI sequences (newlines usually safe, but let's just do simple escaping if needed, actually simple text is fine)
function escapeAnsi(text: string | number) {
  return String(text).replace(/\x1b/g, "");
}

export function TerminalPanel({ title, theme, entries }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const processedCountRef = useRef<number>(0);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      theme: {
        background: "#000000",
        foreground: "#e8e8e8",
      },
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      cursorStyle: "underline",
      cursorBlink: false,
      scrollback: 1000,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    processedCountRef.current = 0; // Reset processed count when terminal is recreated

    term.writeln(`\x1b[1;${theme === "red" ? "31" : "34"}m=== ${title} ===\x1b[0m`);

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, [theme, title]);

  // Write new entries to terminal
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    for (let i = processedCountRef.current; i < entries.length; i++) {
      const entry = entries[i];
      const { type, message } = entry.event;

      let msg = "";

      if (theme === "red") {
        if (type === "tool_start") {
          const e = entry.event as ToolStartEvent;
          msg = `\r\n\x1b[33m[►] Running ${escapeAnsi(e.tool)}...\x1b[0m`;
        } else if (type === "tool_complete") {
          const e = entry.event as ToolCompleteEvent;
          msg = `\r\n\x1b[32m[✓] ${escapeAnsi(e.tool)}: ${e.findings.length} findings\x1b[0m`;
        } else if (type === "tool_fallback") {
          const e = entry.event as ToolFallbackEvent;
          msg = `\r\n\x1b[33m[~] ${escapeAnsi(e.tool)}: used fallback cache\x1b[0m`;
        } else if (type === "red_team_complete") {
          const e = entry.event as RedTeamCompleteEvent;
          msg = `\r\n\x1b[31m[■] Red Team done. ${e.all_findings.length} total findings\x1b[0m`;
        } else if (type === "status") {
          msg = `\r\n\x1b[37m[·] ${escapeAnsi(message)}\x1b[0m`;
        } else if (type === "error") {
          msg = `\r\n\x1b[31m[✗] ERROR: ${escapeAnsi(message)}\x1b[0m`;
        } else if (type === "complete") {
          msg = `\r\n\x1b[32m[✓] ${escapeAnsi(message)}\x1b[0m`;
        }
      } else {
        // blue team
        if (type === "status") {
          msg = `\r\n\x1b[37m[·] ${escapeAnsi(message)}\x1b[0m`;
        } else if ((type as string) === "analysis_start") {
          msg = `\r\n\x1b[34m[►] LLM analyzing findings...\x1b[0m`;
        } else if (type === "analysis_complete") {
          const e = entry.event as AnalysisCompleteEvent;
          msg = `\r\n\x1b[34m[✓] Analysis done. ${e.patches.length} patches\x1b[0m`;
        } else if (type === "pr_created") {
          const e = entry.event as PrCreatedEvent;
          msg = `\r\n\x1b[32m[✓] PR created: \x1b[34m${escapeAnsi(e.pr_url)}\x1b[0m`;
        } else if (type === "error") {
          msg = `\r\n\x1b[31m[✗] ERROR: ${escapeAnsi(message)}\x1b[0m`;
        } else if (type === "complete") {
          msg = `\r\n\x1b[32m[✓] ${escapeAnsi(message)}\x1b[0m`;
        }
      }

      if (msg) {
        term.write(msg); // Notice: we write directly with \r\n included
      }
    }

    processedCountRef.current = entries.length;

    // Trigger fit after writing if needed
    if (entries.length > 0) {
       // slightly delay fit to ensure DOM has stabilized
       setTimeout(() => {
         fitAddonRef.current?.fit();
       }, 10);
    }

  }, [entries, theme]);

  return (
    <div className="flex-1 flex flex-col min-h-[400px] border border-[#2a2a2a] rounded overflow-hidden">
      <div className={`px-4 py-2 text-xs font-bold ${theme === "red" ? "text-[#ef4444] bg-[#ef4444]/10" : "text-[#3b82f6] bg-[#3b82f6]/10"} border-b border-[#2a2a2a]`}>
        {title}
      </div>
      <div className="flex-1 p-2 bg-[#000000] overflow-hidden">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
}
