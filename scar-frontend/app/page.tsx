"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { PrBanner } from "@/components/PrBanner";
import { ScanForm } from "@/components/ScanForm";
import { TerminalPanel } from "@/components/TerminalPanel";
import { FindingsSummary } from "@/components/FindingsSummary";
import { ReportModal } from "@/components/ReportModal";
import { useScanStream } from "@/hooks/useScanStream";

export default function HomePage() {
  const {
    phase,
    logs,
    allFindings,
    patches,
    lastPrUrl,
    startScan,
    reset,
  } = useScanStream();

  const [isReportOpen, setIsReportOpen] = useState(false);

  // Derive terminal events
  const redLogs = logs.filter((l) => l.team === "red");
  const blueLogs = logs.filter((l) => l.team === "blue");

  // Automatically open report modal if patches arrive
  useEffect(() => {
    if (patches.length > 0) {
      setIsReportOpen(true);
    }
  }, [patches]);

  // Reset local state if hook resets
  useEffect(() => {
    if (phase === "idle") {
      setIsReportOpen(false);
    }
  }, [phase]);

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PrBanner prUrl={lastPrUrl} />

        <ScanForm 
          onScan={startScan} 
          onReset={reset} 
          phase={phase} 
        />

        <div className="flex flex-col lg:flex-row gap-4 h-full">
          <TerminalPanel 
            title="RED TEAM" 
            theme="red" 
            entries={redLogs} 
          />
          <TerminalPanel 
            title="BLUE TEAM" 
            theme="blue" 
            entries={blueLogs} 
          />
        </div>

        <FindingsSummary 
          allFindings={allFindings} 
          hasPatches={patches.length > 0} 
          onOpenReport={() => setIsReportOpen(true)} 
        />
      </main>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        patches={patches}
        prUrl={lastPrUrl}
      />
    </>
  );
}
