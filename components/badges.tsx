import type { DigitalMaturity } from "@/data/mock-data";
import { CheckCircleIcon } from "./icons";

export function ModulePill({
  name,
  variant,
}: {
  name: string;
  variant: "active" | "missing";
}) {
  if (variant === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
        {name}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap text-zinc-500 ring-1 ring-inset ring-zinc-300 dark:text-zinc-400 dark:ring-zinc-700">
      {name}
    </span>
  );
}

export function ModulePillList({
  names,
  variant,
  max = 2,
}: {
  names: string[];
  variant: "active" | "missing";
  max?: number;
}) {
  if (names.length === 0) {
    return <span className="text-zinc-400 dark:text-zinc-600">—</span>;
  }
  const visible = names.slice(0, max);
  const extra = names.length - visible.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((name) => (
        <ModulePill key={name} name={name} variant={variant} />
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function IsoBadge({ certified }: { certified: boolean }) {
  if (!certified) {
    return <span className="text-zinc-400 dark:text-zinc-600">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20">
      <CheckCircleIcon className="h-3 w-3" />
      ISO
    </span>
  );
}

type ScoreStatus = "good" | "warning" | "critical";

function scoreStatus(score: number): ScoreStatus {
  if (score >= 70) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

const statusBar: Record<ScoreStatus, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const statusText: Record<ScoreStatus, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  critical: "text-red-700 dark:text-red-400",
};

/** Compact inline meter used in table cells: short bar + number. */
export function CompactMeter({ score }: { score: number }) {
  const status = scoreStatus(score);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${statusBar[status]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${statusText[status]}`}>
        {score}
      </span>
    </div>
  );
}

/** Full meter with label, used in the detail panel. */
export function ScoreMeter({ label, score }: { label: string; score: number }) {
  const status = scoreStatus(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className={`font-semibold tabular-nums ${statusText[status]}`}>{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${statusBar[status]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const digitalMaturityClass: Record<DigitalMaturity, string> = {
  Low: "bg-zinc-100 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  Medium:
    "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  High: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
};

export function DigitalMaturityBadge({ level }: { level: DigitalMaturity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${digitalMaturityClass[level]}`}
    >
      {level}
    </span>
  );
}

export function TeamSplitBar({
  technicians,
  office,
}: {
  technicians: number;
  office: number;
}) {
  const total = technicians + office || 1;
  const techPct = Math.round((technicians / total) * 100);
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full bg-orange-500" style={{ width: `${techPct}%` }} />
        <div className="h-full bg-zinc-400 dark:bg-zinc-600" style={{ width: `${100 - techPct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
          Technicians {technicians}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          Office {office}
        </span>
      </div>
    </div>
  );
}
