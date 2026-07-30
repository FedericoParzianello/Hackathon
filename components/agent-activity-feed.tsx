"use client";

import { useEffect, useState } from "react";
import { TODAY_ISO, type Company } from "@/data/mock-data";
import { buildAgentActivity } from "@/lib/agent-activity";
import { pillarMeta } from "./pillar-badge";

function formatMinutesAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h ago` : `${hours}h ${rest}m ago`;
}

export function AgentActivityFeed({ companies }: { companies: Company[] }) {
  const runs = buildAgentActivity(companies, TODAY_ISO);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Agent Activity</h2>
      </div>

      <ul className="space-y-3">
        {runs.map((run, index) => {
          const meta = pillarMeta[run.pillar];
          const Icon = meta.icon;
          return (
            <li
              key={run.id}
              className={`flex gap-3 transition-all duration-500 ease-out ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${meta.dotClassName}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {index < runs.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {run.agentName}
                  </span>
                  <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">
                    {formatMinutesAgo(run.minutesAgo)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {run.summary}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
