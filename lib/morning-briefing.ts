// Pure, testable aggregation across the product's 4 pillars — Next Best
// Action, Health Score, Competitive Market Analysis, and Auto Enrich — into
// one prioritized worklist. No magic numbers outside this file; the
// <40 "critical" data-quality cutoff matches components/badges.tsx.
//
// Renewal dates in this dataset are generated 60-420 days out (see
// data/mock-data.ts), so a 30-day "coming up soon" window — mirroring
// lib/health-score.ts's own renewal-risk cutoff — would never fire. This
// file uses a wider 90-day window so "renewal coming up soon" actually
// surfaces accounts in this portfolio.

import { competitorById, type Company } from "@/data/mock-data";
import { computeHealthScore } from "@/lib/health-score";
import { computeNextBestAction } from "@/lib/nba";

export type BriefingPillar = "nba" | "health" | "competitive" | "enrichment";

export const BRIEFING_PILLARS: BriefingPillar[] = [
  "nba",
  "health",
  "competitive",
  "enrichment",
];

export interface BriefingItem {
  id: string;
  companyId: string;
  companyName: string;
  pillar: BriefingPillar;
  flag: string | null;
  recommendation: string;
  urgency: number;
}

const NBA_CANDIDATE_LIMIT = 5;
// Exported so other pillar-adjacent views (e.g. lib/agent-activity.ts) reuse
// the exact same "at risk" / "critical" semantics instead of redefining them.
export const HEALTH_SCORE_AT_RISK_THRESHOLD = 50;
export const RENEWAL_SOON_DAYS = 90;
export const DATA_QUALITY_CRITICAL_THRESHOLD = 40;

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

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

function buildNbaItems(companies: Company[], today: string): BriefingItem[] {
  const candidates = companies
    .map((company) => {
      const nba = computeNextBestAction(company);
      if (nba.moduleId === null) return null;
      const healthScore = healthScoreOf(company, today);
      const urgency = healthScore + company.missingModuleIds.length;
      return { company, nba, urgency };
    })
    .filter((c): c is { company: Company; nba: ReturnType<typeof computeNextBestAction>; urgency: number } => c !== null)
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, NBA_CANDIDATE_LIMIT);

  return candidates.map(({ company, nba, urgency }) => ({
    id: `${company.id}-nba`,
    companyId: company.id,
    companyName: company.name,
    pillar: "nba",
    flag: null,
    recommendation: `Pitch ${nba.moduleName}: ${nba.explanation}`,
    urgency,
  }));
}

function buildHealthItems(companies: Company[], today: string): BriefingItem[] {
  const items: BriefingItem[] = [];
  for (const company of companies) {
    const healthScore = healthScoreOf(company, today);
    const daysToRenewal = daysBetween(today, company.renewalDate);
    const isLowHealth = healthScore < HEALTH_SCORE_AT_RISK_THRESHOLD;
    const isRenewalSoon = daysToRenewal <= RENEWAL_SOON_DAYS;
    if (!isLowHealth && !isRenewalSoon) continue;

    let urgency = 0;
    if (isLowHealth) urgency += (HEALTH_SCORE_AT_RISK_THRESHOLD - healthScore) * 2;
    if (isRenewalSoon) urgency += (RENEWAL_SOON_DAYS - Math.max(0, daysToRenewal)) * 2;

    const reasons: string[] = [];
    if (isLowHealth) reasons.push(`health score is ${healthScore}/100`);
    if (isRenewalSoon) {
      reasons.push(
        daysToRenewal <= 0
          ? "renewal is overdue"
          : `renewal is in ${daysToRenewal} day${daysToRenewal === 1 ? "" : "s"}`,
      );
    }

    items.push({
      id: `${company.id}-health`,
      companyId: company.id,
      companyName: company.name,
      pillar: "health",
      flag: "At risk",
      recommendation: `Schedule a check-in — ${reasons.join(" and ")}.`,
      urgency,
    });
  }
  return items;
}

function buildCompetitiveItems(companies: Company[]): BriefingItem[] {
  const items: BriefingItem[] = [];
  for (const company of companies) {
    if (!company.competitorPresence) continue;
    const { competitorId, status, months } = company.competitorPresence;
    const competitor = competitorById.get(competitorId);
    if (!competitor) continue;

    const statusWeight = status === "using" ? 60 : 40;
    const urgency = statusWeight + Math.min(months, 24) * 1.5;

    const statusText =
      status === "using"
        ? `has been using ${competitor.name} for ${months} month${months === 1 ? "" : "s"}`
        : `is evaluating ${competitor.name} (${months} month${months === 1 ? "" : "s"} in)`;

    items.push({
      id: `${company.id}-competitive`,
      companyId: company.id,
      companyName: company.name,
      pillar: "competitive",
      flag: "Competitive threat",
      recommendation: `This account ${statusText}. ${competitor.howToWin}`,
      urgency,
    });
  }
  return items;
}

function buildEnrichmentItems(companies: Company[]): BriefingItem[] {
  const items: BriefingItem[] = [];
  for (const company of companies) {
    if (company.dataQualityScore >= DATA_QUALITY_CRITICAL_THRESHOLD) continue;
    const urgency = 100 - company.dataQualityScore;
    items.push({
      id: `${company.id}-enrichment`,
      companyId: company.id,
      companyName: company.name,
      pillar: "enrichment",
      flag: "Data needs enrichment",
      recommendation: `Data quality is ${company.dataQualityScore}/100 — run Auto Enrich on this account to close the gap.`,
      urgency,
    });
  }
  return items;
}

/** Aggregates all 4 pillars into one worklist, sorted by urgency (highest first). */
export function buildMorningBriefing(companies: Company[], today: string): BriefingItem[] {
  const items = [
    ...buildNbaItems(companies, today),
    ...buildHealthItems(companies, today),
    ...buildCompetitiveItems(companies),
    ...buildEnrichmentItems(companies),
  ];
  return items.sort((a, b) => b.urgency - a.urgency);
}

/**
 * Picks the top `limit` items for display. Each pillar's single most urgent
 * item is guaranteed a slot (so a briefing never silently drops one of the
 * 4 pillars just because another pillar has more candidates in it), then
 * remaining slots are filled by pure urgency. The result is always sorted
 * by urgency, so guaranteeing representation never overrides priority order
 * within what's shown.
 */
export function selectTopPriorities(items: BriefingItem[], limit: number): BriefingItem[] {
  const selected = new Map<string, BriefingItem>();

  for (const pillar of BRIEFING_PILLARS) {
    const topOfPillar = items.find((item) => item.pillar === pillar);
    if (topOfPillar) selected.set(topOfPillar.id, topOfPillar);
  }

  for (const item of items) {
    if (selected.size >= limit) break;
    if (!selected.has(item.id)) selected.set(item.id, item);
  }

  return Array.from(selected.values()).sort((a, b) => b.urgency - a.urgency);
}
