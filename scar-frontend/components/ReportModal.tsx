"use client";

import { useEffect } from "react";

interface Patch {
  severity?: string;
  file?: string;
  vuln_type?: string;
  description?: string;
  code?: string;
  [key: string]: unknown;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patches: Patch[];
  prUrl: string | null;
}

export function ReportModal({ isOpen, onClose, patches, prUrl }: ReportModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSeverityColor = (sev?: string) => {
    const s = sev?.toLowerCase() || "";
    if (s.includes("critical")) return "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30";
    if (s.includes("high")) return "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30";
    if (s.includes("medium")) return "bg-[#eab308]/20 text-[#eab308] border-[#eab308]/30";
    if (s.includes("low")) return "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30";
    return "bg-[#2a2a2a] text-[#888888] border-[#2a2a2a]";
  };

  const isValidUrl = prUrl?.startsWith("https://github.com/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Box */}
      <div className="w-full max-w-[800px] max-h-[90vh] bg-[#111111] border border-[#2a2a2a] rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-[#e8e8e8]">Security Analysis Report</h2>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#e8e8e8] transition-colors"
            title="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {patches.map((patch, idx) => (
            <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#e8e8e8] text-base mb-1">
                    {patch.vuln_type || "Unknown Vulnerability"}
                  </h3>
                  <div className="font-mono text-xs text-[#888888] break-all">
                    {patch.file || "Unknown File"}
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 text-xs font-bold uppercase rounded border ${getSeverityColor(
                    patch.severity
                  )}`}
                >
                  {patch.severity || "Unknown"}
                </div>
              </div>

              <div className="text-sm text-[#e8e8e8] mb-4 whitespace-pre-wrap">
                {patch.description || "No description provided."}
              </div>

              {patch.code && (
                <div className="mt-4">
                  <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                    Patch Content
                  </span>
                  <pre className="mt-2 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded overflow-x-auto text-xs font-mono text-[#e8e8e8]">
                    {patch.code}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-between bg-[#0d0d0d] rounded-b-lg">
          {isValidUrl ? (
            <a
              href={prUrl as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-2 bg-[#22c55e] text-white font-bold inline-block hover:bg-[#166534] transition-colors rounded"
            >
              View Pull Request &rarr;
            </a>
          ) : prUrl ? (
            <span className="text-sm px-4 py-2 bg-[#2a2a2a] text-[#888888] font-bold rounded cursor-not-allowed">
              Invalid PR URL
            </span>
          ) : (
            <div /> /* invisible spacer if no PR */
          )}

          <button
            onClick={onClose}
            className="text-sm px-4 py-2 border border-[#2a2a2a] text-[#e8e8e8] hover:bg-[#1a1a1a] transition-colors font-bold rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
