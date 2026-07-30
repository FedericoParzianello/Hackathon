"use client";

import { useState, type ReactNode } from "react";
import { TODAY_ISO, type Company } from "@/data/mock-data";
import {
  detectCompetitorMention,
  detectModuleRejection,
  analyzeThreat,
  type CompetitorMention,
  type ThreatAnalysis,
} from "@/lib/call-note-analysis";
import { useAgentActivity } from "./agent-activity-context";
import { PhoneIcon, AlertTriangleIcon, CheckCircleIcon } from "./icons";

type Result =
  | { kind: "competitor"; sourceText: string; mention: CompetitorMention }
  | { kind: "threat"; sourceText: string; threat: ThreatAnalysis }
  | { kind: "saved" };

const riskBadgeClass: Record<ThreatAnalysis["riskLevel"], string> = {
  High: "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/25",
  Medium:
    "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/25",
};

/** Renders `text` with the first case-insensitive occurrence of `match` highlighted. */
function withHighlight(text: string, match: string): ReactNode {
  const index = text.toLowerCase().indexOf(match.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-200 px-0.5 font-semibold text-zinc-900 dark:bg-yellow-500/30 dark:text-yellow-100">
        {text.slice(index, index + match.length)}
      </mark>
      {text.slice(index + match.length)}
    </>
  );
}

export function CallNotePanel({
  company,
  onUpdateCompany,
}: {
  company: Company;
  onUpdateCompany: (companyId: string, patch: Partial<Company>) => void;
}) {
  const { logEvent } = useAgentActivity();
  const [note, setNote] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [visible, setVisible] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  function reveal() {
    setVisible(false);
    setPulsing(false);
    requestAnimationFrame(() => {
      setVisible(true);
      setPulsing(true);
    });
    window.setTimeout(() => setPulsing(false), 1800);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = note.trim();
    if (!text) return;

    const mention = detectCompetitorMention(text);
    if (mention) {
      onUpdateCompany(company.id, {
        competitorPresence: { competitorId: mention.competitor.id, status: "evaluating", months: 1 },
      });
      setResult({ kind: "competitor", sourceText: text, mention });
      logEvent({
        pillar: "competitive",
        agentName: "Market Agent",
        summary: `Competitor threat identified for ${company.name}: ${mention.competitor.name} mentioned in a call note.`,
      });
      setNote("");
      reveal();
      return;
    }

    const rejection = detectModuleRejection(text);
    if (rejection) {
      const threat = analyzeThreat(company, rejection.moduleId, TODAY_ISO);
      if (threat) {
        setResult({ kind: "threat", sourceText: text, threat });
        logEvent({
          pillar: "competitive",
          agentName: "Market Agent",
          summary: `Competitor threat identified for ${company.name}: ${
            threat.competitor.name
          } flagged as ${threat.riskLevel.toLowerCase()} risk after a ${threat.moduleName} pushback.`,
        });
        setNote("");
        reveal();
        return;
      }
    }

    setResult({ kind: "saved" });
    setNote("");
    reveal();
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        <PhoneIcon className="h-3.5 w-3.5" />
        Log call note
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. client mentioned they're evaluating ServiceGrid for invoicing"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
        >
          Log
        </button>
      </form>

      {result && (
        <div
          className={`mt-3 transition-all duration-500 ease-out ${
            visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1.5 scale-95 opacity-0"
          }`}
        >
          {result.kind === "competitor" && (
            <div
              className={`rounded-lg border-2 border-red-300 bg-red-50 p-3 transition-shadow duration-700 dark:border-red-500/40 dark:bg-red-500/10 ${
                pulsing ? "ring-4 ring-red-400/40" : "ring-0"
              }`}
            >
              <div className="mb-1.5 text-sm font-bold text-red-700 dark:text-red-400">
                &#9876;&#65039; Competitor detected: {result.mention.competitor.name} &mdash; here&apos;s how to win
              </div>
              <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                &ldquo;{withHighlight(result.sourceText, result.mention.matchedText)}&rdquo;
              </p>
              <div className="rounded-md bg-white/70 p-2 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
                {result.mention.competitor.howToWin}
              </div>
            </div>
          )}

          {result.kind === "threat" && (
            <div
              className={`rounded-lg border-2 border-amber-300 bg-amber-50 p-3 transition-shadow duration-700 dark:border-amber-500/40 dark:bg-amber-500/10 ${
                pulsing ? "ring-4 ring-amber-400/40" : "ring-0"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangleIcon className="h-4 w-4" />
                  Threat Analysis
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${riskBadgeClass[result.threat.riskLevel]}`}
                >
                  {result.threat.riskLevel} risk
                </span>
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {result.threat.competitor.name}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                {result.threat.why}
              </p>
              <div className="mt-2 rounded-md bg-white/70 p-2 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
                <span className="font-semibold">How to win:</span> {result.threat.competitor.howToWin}
              </div>
            </div>
          )}

          {result.kind === "saved" && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              Note saved.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
