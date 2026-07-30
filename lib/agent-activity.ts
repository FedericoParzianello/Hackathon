// Pure, testable summary of what each pillar's autonomous agent would have
// just done, run against the real company data — not hardcoded flavor
// numbers. Mirrors the CLAUDE.md `agent_runs` idea (every agent action is
// logged) as a lightweight read-only feed for the Morning Briefing page.

import { competitorById, modules, type Company } from "@/data/mock-data";
import { computeHealthScore } from "@/lib/health-score";
import { computeNextBestAction } from "@/lib/nba";
import { generateEnrichmentSuggestions } from "@/lib/enrichment";
import {
  HEALTH_SCORE_AT_RISK_THRESHOLD,
  RENEWAL_SOON_DAYS,
} from "@/lib/morning-briefing";
import type { BriefingPillar } from "@/lib/morning-briefing";

export interface AgentRun {
  id: string;
  pillar: BriefingPillar;
  agentName: string;
  summary: string;
  /** Minutes since this (simulated) run completed — for display only. */
  minutesAgo: number;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

function healthScoreOf(company: Company, today: string): number {
  return computeHealthScore({
    isoCertified: company.isoCertified,
    digitalMaturity: company.digitalMaturity,
    avgResponseTimeHours: company.avgResponseTimeHours,
    dataQualityScore: company.dataQualityScore,
    lastContactDate: company.lastContactDate,
    renewalDate: company.renewalDate,
    today,
  }).score;
}

function buildEnrichmentRun(companies: Company[], today: string): AgentRun {
  let totalSuggestions = 0;
  let accountsWithSuggestions = 0;
  for (const company of companies) {
    const count = generateEnrichmentSuggestions(company, companies, today).length;
    if (count > 0) accountsWithSuggestions++;
    totalSuggestions += count;
  }

  return {
    id: "run-enrichment",
    pillar: "enrichment",
    agentName: "Enrichment Agent",
    summary: `Scanned ${companies.length} accounts for CRM-pattern anomalies, proposed ${totalSuggestions} update${
      totalSuggestions === 1 ? "" : "s"
    } across ${accountsWithSuggestions} account${accountsWithSuggestions === 1 ? "" : "s"}.`,
    minutesAgo: 6,
  };
}

function buildNbaRun(companies: Company[]): AgentRun {
  let actionable = 0;
  let potentialMonthlyValue = 0;
  for (const company of companies) {
    const nba = computeNextBestAction(company);
    if (nba.moduleId === null) continue;
    actionable++;
    const mod = modules.find((m) => m.id === nba.moduleId);
    if (mod) {
      potentialMonthlyValue += mod.monthlyPrice * (mod.perUser ? company.technicianCount : 1);
    }
  }

  return {
    id: "run-nba",
    pillar: "nba",
    agentName: "NBA Agent",
    summary: `Evaluated ${companies.length} accounts against module dependencies and usage signals, surfaced ${actionable} next-best-action pitch${
      actionable === 1 ? "" : "es"
    } worth ~$${potentialMonthlyValue.toLocaleString("en-US")}/mo in potential upsell.`,
    minutesAgo: 22,
  };
}

function buildMarketRun(companies: Company[]): AgentRun {
  const exposed = companies.filter((c) => c.competitorPresence !== null);
  const using = exposed.filter((c) => c.competitorPresence?.status === "using");
  const usingCountByCompetitorId = using.reduce<Record<string, number>>((acc, c) => {
    const id = c.competitorPresence!.competitorId;
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const topId = Object.entries(usingCountByCompetitorId).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topCompetitor = topId ? competitorById.get(topId) : undefined;

  return {
    id: "run-market",
    pillar: "competitive",
    agentName: "Market Agent",
    summary: `Cross-referenced ${companies.length} accounts against known competitor signals, flagged ${exposed.length} with active competitor presence (${using.length} already using one)${
      topCompetitor ? ` — most often ${topCompetitor.name}` : ""
    }.`,
    minutesAgo: 41,
  };
}

function buildHealthRun(companies: Company[], today: string): AgentRun {
  let lowHealth = 0;
  let renewalSoon = 0;
  for (const company of companies) {
    const score = healthScoreOf(company, today);
    if (score < HEALTH_SCORE_AT_RISK_THRESHOLD) lowHealth++;
    if (daysBetween(today, company.renewalDate) <= RENEWAL_SOON_DAYS) renewalSoon++;
  }

  return {
    id: "run-health",
    pillar: "health",
    agentName: "Health Agent",
    summary: `Recalculated health scores for ${companies.length} accounts, flagged ${lowHealth} below ${HEALTH_SCORE_AT_RISK_THRESHOLD}/100 and ${renewalSoon} with a renewal inside ${RENEWAL_SOON_DAYS} days.`,
    minutesAgo: 58,
  };
}

/** One recent run per pillar agent, most recent first. All figures are computed from live company data. */
export function buildAgentActivity(companies: Company[], today: string): AgentRun[] {
  return [
    buildEnrichmentRun(companies, today),
    buildNbaRun(companies),
    buildMarketRun(companies),
    buildHealthRun(companies, today),
  ].sort((a, b) => a.minutesAgo - b.minutesAgo);
}
