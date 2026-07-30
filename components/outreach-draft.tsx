"use client";

import { useState } from "react";
import type { Company } from "@/data/mock-data";
import type { NextBestAction } from "@/lib/nba";
import { generateOutreachDraft } from "@/lib/outreach";
import { MailIcon, LoaderIcon, ClipboardIcon, CheckCircleIcon } from "./icons";

type Stage = "idle" | "generating" | "ready";

export function OutreachDraftPanel({
  company,
  nba,
}: {
  company: Company;
  nba: NextBestAction;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [copied, setCopied] = useState(false);
  const [queued, setQueued] = useState(false);

  if (nba.moduleId === null) return null;

  const draft = stage === "ready" ? generateOutreachDraft(company, nba) : null;

  function generate() {
    setStage("generating");
    setCopied(false);
    setQueued(false);
    window.setTimeout(() => setStage("ready"), 700);
  }

  function copyDraft() {
    if (!draft) return;
    navigator.clipboard?.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3">
      {stage === "idle" && (
        <button
          type="button"
          onClick={generate}
          className="inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:border-orange-500/30 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-500/10"
        >
          <MailIcon className="h-3.5 w-3.5" />
          Generate outreach draft
        </button>
      )}

      {stage === "generating" && (
        <div className="flex items-center gap-2 text-xs font-medium text-orange-700 dark:text-orange-400">
          <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
          Drafting outreach&hellip;
        </div>
      )}

      {stage === "ready" && draft && (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Subject: <span className="text-zinc-800 dark:text-zinc-200">{draft.subject}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
            {draft.body}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyDraft}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {copied ? (
                <>
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setQueued(true)}
              disabled={queued}
              className={
                queued
                  ? "inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "inline-flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-600"
              }
            >
              {queued ? (
                <>
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Queued for send
                </>
              ) : (
                "Approve & queue"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
