"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface PrBannerProps {
  prUrl: string | null;
}

export function PrBanner({ prUrl }: PrBannerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (prUrl && !hasFired.current) {
      hasFired.current = true;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.4 },
      });
    }
  }, [prUrl]);

  // Reset when prUrl becomes null
  useEffect(() => {
    if (!prUrl) {
      hasFired.current = false;
    }
  }, [prUrl]);

  if (!prUrl) return null;

  // Basic validation that it's a GitHub URL before treating as link
  const isValidUrl = prUrl.startsWith("https://github.com/");

  return (
    <div className="bg-[#166534] text-white px-6 py-3 rounded flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span className="font-semibold text-sm">
          Pull Request created
        </span>
      </div>
      {isValidUrl ? (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold bg-white/20 hover:bg-white/30 transition-colors px-4 py-1.5 rounded"
        >
          View PR &rarr;
        </a>
      ) : (
        <span className="text-sm font-bold bg-white/20 px-4 py-1.5 rounded cursor-not-allowed">
          Invalid PR URL
        </span>
      )}
    </div>
  );
}
