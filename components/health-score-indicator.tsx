"use client";

import { useEffect, useRef, useState } from "react";
import { TODAY_ISO, type Company } from "@/data/mock-data";
import { computeHealthScore, type HealthScoreFactor } from "@/lib/health-score";

type Status = "good" | "warning" | "critical";

function scoreStatus(score: number): Status {
  if (score >= 70) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

const barColor: Record<Status, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const textColor: Record<Status, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  critical: "text-red-700 dark:text-red-400",
};

function factorsToTitle(score: number, factors: HealthScoreFactor[]): string {
  const lines = factors.map(
    (factor) => `${factor.label}: ${factor.delta > 0 ? "+" : ""}${factor.delta}`,
  );
  return [`Health score: ${score}/100`, ...lines].join("\n");
}

const POPOVER_WIDTH = 288;

export function HealthScoreIndicator({
  company,
  variant = "compact",
}: {
  company: Company;
  variant?: "compact" | "full";
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { score, factors } = computeHealthScore({
    isoCertified: company.isoCertified,
    digitalMaturity: company.digitalMaturity,
    avgResponseTimeHours: company.avgResponseTimeHours,
    dataQualityScore: company.dataQualityScore,
    lastContactDate: company.lastContactDate,
    renewalDate: company.renewalDate,
    today: TODAY_ISO,
  });
  const status = scoreStatus(score);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function handleScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  function toggleOpen(event: React.MouseEvent) {
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 12),
      });
    }
    setOpen(true);
  }

  const popover = open && coords && (
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: coords.top, left: coords.left, width: POPOVER_WIDTH }}
      className="z-50 rounded-lg border border-zinc-200 bg-white p-3 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          Health score breakdown
        </span>
        <span className={`font-semibold tabular-nums ${textColor[status]}`}>{score}/100</span>
      </div>
      <ul className="space-y-1">
        {factors.map((factor) => (
          <li
            key={factor.label}
            className="flex items-center justify-between gap-3 text-zinc-600 dark:text-zinc-400"
          >
            <span>{factor.label}</span>
            <span
              className={`font-medium tabular-nums ${
                factor.delta >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {factor.delta > 0 ? `+${factor.delta}` : factor.delta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (variant === "full") {
    return (
      <div>
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleOpen}
          title={factorsToTitle(score, factors)}
          className="block w-full cursor-pointer text-left"
        >
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Account health</span>
            <span className={`font-semibold tabular-nums ${textColor[status]}`}>{score}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${barColor[status]}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </button>
        {popover}
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        title={factorsToTitle(score, factors)}
        className="inline-flex cursor-pointer items-center gap-2"
      >
        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <span
            className={`block h-full rounded-full ${barColor[status]}`}
            style={{ width: `${score}%` }}
          />
        </span>
        <span className={`text-xs font-semibold tabular-nums ${textColor[status]}`}>{score}</span>
      </button>
      {popover}
    </>
  );
}
