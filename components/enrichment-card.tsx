"use client";

import { useState } from "react";
import { TODAY_ISO, type Company } from "@/data/mock-data";
import { generateEnrichmentSuggestions, type EnrichmentSuggestion } from "@/lib/enrichment";
import { SparklesIcon, LoaderIcon, CheckCircleIcon, XIcon } from "./icons";

type SuggestionStatus = "pending" | "accepted" | "dismissed";
type Stage = "idle" | "loading" | "ready";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tone =
    confidence >= 80
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
      : confidence >= 60
        ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
        : "bg-zinc-100 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset ${tone}`}
    >
      {confidence}% confidence
    </span>
  );
}

function SuggestionRow({
  suggestion,
  status,
  onAccept,
  onDismiss,
}: {
  suggestion: EnrichmentSuggestion;
  status: SuggestionStatus;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {suggestion.headline}
        </div>
        <ConfidenceBadge confidence={suggestion.confidence} />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {suggestion.detail}
      </p>
      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">
        Source: {suggestion.source} &middot; Detected {formatDate(suggestion.detectedDate)}
      </div>
      <div className="mt-2">
        {status === "pending" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <XIcon className="h-3.5 w-3.5" />
              Dismiss
            </button>
          </div>
        )}
        {status === "accepted" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Accepted
          </span>
        )}
        {status === "dismissed" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <XIcon className="h-3.5 w-3.5" />
            Dismissed
          </span>
        )}
      </div>
    </div>
  );
}

export function EnrichmentCard({ company }: { company: Company }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [statuses, setStatuses] = useState<Record<string, SuggestionStatus>>({});

  function runEnrichment() {
    setStage("loading");
    window.setTimeout(() => {
      const results = generateEnrichmentSuggestions(company, TODAY_ISO);
      setSuggestions(results);
      setStatuses(
        Object.fromEntries(results.map((s) => [s.id, "pending" as SuggestionStatus])),
      );
      setStage("ready");
    }, 900);
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <SparklesIcon className="h-3.5 w-3.5" />
          Auto Enrich
        </div>
        {stage === "idle" && (
          <button
            type="button"
            onClick={runEnrichment}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            Enrich
          </button>
        )}
      </div>

      {stage === "idle" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Scan public sources for updates to this account&apos;s data.
        </p>
      )}

      {stage === "loading" && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <LoaderIcon className="h-4 w-4 animate-spin" />
          Scanning public sources&hellip;
        </div>
      )}

      {stage === "ready" && (
        <div className="space-y-2">
          {suggestions.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No updates found for this account.
            </p>
          )}
          {suggestions.map((s) => (
            <SuggestionRow
              key={s.id}
              suggestion={s}
              status={statuses[s.id] ?? "pending"}
              onAccept={() => setStatuses((prev) => ({ ...prev, [s.id]: "accepted" }))}
              onDismiss={() => setStatuses((prev) => ({ ...prev, [s.id]: "dismissed" }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
