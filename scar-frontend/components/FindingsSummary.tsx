"use client";

interface FindingsSummaryProps {
  allFindings: Record<string, unknown>[];
  onOpenReport: () => void;
  hasPatches: boolean;
}

export function FindingsSummary({ allFindings, onOpenReport, hasPatches }: FindingsSummaryProps) {
  if (allFindings.length === 0) return null;

  // Simple breakdown
  const severities = { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 };
  const tools = new Set<string>();

  allFindings.forEach((f) => {
    const info = Array.isArray(f.info) ? f.info[0] : f.info;
    const s = String((info as Record<string, unknown>)?.severity || f.severity || "unknown").toLowerCase();
    
    if (s.includes("critical")) severities.critical++;
    else if (s.includes("high")) severities.high++;
    else if (s.includes("medium")) severities.medium++;
    else if (s.includes("low")) severities.low++;
    else if (s.includes("info")) severities.info++;
    else severities.unknown++;

    // Some tools put their name, otherwise it's nuclei typically or something
    tools.add((f.tool as string) || "Nuclei / Tool"); 
    // ^ the backend structure is flexible, so we just group generically by unique sources if 'tool' exists
  });

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 className="text-[#e8e8e8] font-bold text-sm">
          {allFindings.length} findings detected
        </h3>
        <div className="flex gap-3 mt-2 text-xs font-semibold rounded bg-[#1a1a1a] px-3 py-1.5 w-max border border-[#2a2a2a]">
          {severities.critical > 0 && <span className="text-[#ef4444]">CRIT: {severities.critical}</span>}
          {severities.high > 0 && <span className="text-[#f97316]">HIGH: {severities.high}</span>}
          {severities.medium > 0 && <span className="text-[#eab308]">MED: {severities.medium}</span>}
          {severities.low > 0 && <span className="text-[#3b82f6]">LOW: {severities.low}</span>}
          {severities.info > 0 && <span className="text-[#888888]">INFO: {severities.info}</span>}
          {severities.unknown > 0 && <span className="text-[#888888]">UNKN: {severities.unknown}</span>}
        </div>
      </div>
      
      {hasPatches && (
        <button
          onClick={onOpenReport}
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e8e8e8] transition-colors border border-[#3a3a3a] px-4 py-2 rounded text-sm font-bold"
        >
          View in Report
        </button>
      )}
    </div>
  );
}
