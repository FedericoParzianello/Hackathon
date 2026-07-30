// "Auto Enrich" suggestion generator — pure and deterministic.
//
// Every suggestion is derived by comparing this company's own recorded
// fields against patterns observed across the other companies already in
// the CRM (data/mock-data.ts). No external facts are invented: if a
// company matches its peers, it gets no suggestions at all.
//
// No suggestion is ever applied automatically: the UI always presents
// these as pending proposals for a human to accept or dismiss.

import type { Company } from "@/data/mock-data";

export type EnrichmentSuggestionKind =
  | "headcount_outdated"
  | "data_quality_gap"
  | "fleet_inconsistency";

export interface EnrichmentSuggestion {
  id: string;
  kind: EnrichmentSuggestionKind;
  /** Short label for what changed. */
  headline: string;
  /** Longer supporting detail. */
  detail: string;
  /** 0-100 confidence that the suggestion is worth acting on. */
  confidence: number;
  source: string;
  /** ISO date the pattern analysis ran. */
  analyzedDate: string;
  /** Field this suggestion would write on accept, and its proposed value. */
  suggestedEmployeeCount?: number;
  suggestedDataQualityScore?: number;
  suggestedFleetSize?: number;
}

const SOURCE_LABEL = "Internal CRM pattern analysis";

// Minimum relative/absolute deviation from peers before a pattern is
// considered worth surfacing, so near-average accounts get no suggestions.
const HEADCOUNT_DEVIATION_THRESHOLD = 0.35;
const DATA_QUALITY_GAP_THRESHOLD = 15;
const FLEET_RATIO_DEVIATION_THRESHOLD = 0.4;

// How far to move headcount toward the peer benchmark when a suggestion is
// accepted — a partial correction rather than snapping straight to the
// average, since the peer number is a signal, not a certainty.
const HEADCOUNT_CORRECTION_FACTOR = 0.3;

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

function confidenceFromDeviation(deviation: number, base: number, scale: number): number {
  return Math.min(95, Math.round(base + Math.abs(deviation) * scale));
}

interface Candidate {
  kind: EnrichmentSuggestionKind;
  headline: string;
  detail: string;
  confidence: number;
  suggestedEmployeeCount?: number;
  suggestedDataQualityScore?: number;
  suggestedFleetSize?: number;
}

function buildHeadcountCandidate(company: Company, peers: Company[]): Candidate | null {
  if (peers.length === 0) return null;
  const peerAvg = average(peers.map((p) => p.employeeCount));
  const deviation = (company.employeeCount - peerAvg) / peerAvg;
  if (Math.abs(deviation) < HEADCOUNT_DEVIATION_THRESHOLD) return null;

  const direction = deviation > 0 ? "above" : "below";
  const suggestedEmployeeCount = Math.max(
    1,
    Math.round(company.employeeCount + (peerAvg - company.employeeCount) * HEADCOUNT_CORRECTION_FACTOR),
  );

  return {
    kind: "headcount_outdated",
    headline: `Headcount may be outdated: ${company.employeeCount} vs ${Math.round(peerAvg)} ${company.subSector} average`,
    detail: `${company.subSector} peers in your CRM average ${Math.round(peerAvg)} employees — this account is ${Math.round(
      Math.abs(deviation) * 100,
    )}% ${direction} that, which is a common sign the headcount on file hasn't been refreshed recently.`,
    confidence: confidenceFromDeviation(deviation, 55, 60),
    suggestedEmployeeCount,
  };
}

function buildDataQualityCandidate(
  company: Company,
  peers: Company[],
  today: string,
): Candidate | null {
  if (peers.length === 0) return null;
  const peerAvg = average(peers.map((p) => p.dataQualityScore));
  const peerBest = Math.max(...peers.map((p) => p.dataQualityScore));
  const gap = peerAvg - company.dataQualityScore;
  if (gap < DATA_QUALITY_GAP_THRESHOLD) return null;

  const staleSignals: string[] = [];
  const daysSinceContact = daysBetween(company.lastContactDate, today);
  if (daysSinceContact > 90) {
    staleSignals.push(`last contact was ${daysSinceContact} days ago`);
  }
  if (!company.isoCertified) {
    staleSignals.push("no ISO certification on file");
  }
  if (company.brands.length <= 1) {
    staleSignals.push("only one brand recorded");
  }
  if (company.avgResponseTimeHours > 24) {
    staleSignals.push("average response time looks unusually high");
  }
  const fieldList = staleSignals.length > 0 ? staleSignals.join("; ") : "several profile fields";

  // Accepting means the rep goes and fills in the listed gaps, so the
  // record is brought fully in line with the best-documented peer on
  // file — not just nudged toward the (much lower) CRM-wide average.
  const suggestedDataQualityScore = Math.max(company.dataQualityScore, peerBest);

  return {
    kind: "data_quality_gap",
    headline: `Data quality (${company.dataQualityScore}) is ${Math.round(gap)} pts below CRM average (${Math.round(peerAvg)})`,
    detail: `Likely incomplete or stale: ${fieldList}. Your best-documented account on file scores ${peerBest}.`,
    confidence: confidenceFromDeviation(gap, 50, 1),
    suggestedDataQualityScore,
  };
}

function buildFleetCandidate(company: Company, peers: Company[]): Candidate | null {
  const ratioPeers = peers.filter((p) => p.technicianCount > 0);
  if (ratioPeers.length === 0 || company.technicianCount === 0) return null;

  const peerAvgRatio = average(ratioPeers.map((p) => p.fleetSize / p.technicianCount));
  const companyRatio = company.fleetSize / company.technicianCount;
  const deviation = (companyRatio - peerAvgRatio) / peerAvgRatio;
  if (Math.abs(deviation) < FLEET_RATIO_DEVIATION_THRESHOLD) return null;

  const direction = deviation > 0 ? "more vehicles than" : "fewer vehicles than";
  const suggestedFleetSize = Math.max(1, Math.round(company.technicianCount * peerAvgRatio));

  return {
    kind: "fleet_inconsistency",
    headline: `Fleet size (${company.fleetSize}) is inconsistent with technician count (${company.technicianCount})`,
    detail: `This account has ${direction} the ~${peerAvgRatio.toFixed(
      1,
    )} vehicles-per-technician ratio seen across similar accounts — expected fleet size is closer to ${suggestedFleetSize}.`,
    confidence: confidenceFromDeviation(deviation, 55, 50),
    suggestedFleetSize,
  };
}

/**
 * Compares one company's fields against patterns in the rest of the CRM
 * and returns any anomalies worth flagging. Purely a function of the data
 * already on file — an account that matches its peers gets zero suggestions.
 */
export function generateEnrichmentSuggestions(
  company: Company,
  allCompanies: Company[],
  today: string,
): EnrichmentSuggestion[] {
  const subSectorPeers = allCompanies.filter(
    (c) => c.id !== company.id && c.subSector === company.subSector,
  );
  const allPeers = allCompanies.filter((c) => c.id !== company.id);

  const candidates = [
    buildHeadcountCandidate(company, subSectorPeers),
    buildDataQualityCandidate(company, allPeers, today),
    buildFleetCandidate(company, allPeers),
  ].filter((c): c is Candidate => c !== null);

  candidates.sort((a, b) => b.confidence - a.confidence);

  return candidates.map((candidate, index) => ({
    id: `${company.id}-enrich-${index}`,
    analyzedDate: today,
    source: SOURCE_LABEL,
    ...candidate,
  }));
}

/** Pure patch computation for what accepting a suggestion writes to the company record. */
export function applyEnrichmentSuggestion(suggestion: EnrichmentSuggestion): Partial<Company> {
  switch (suggestion.kind) {
    case "headcount_outdated":
      return { employeeCount: suggestion.suggestedEmployeeCount };
    case "data_quality_gap":
      return { dataQualityScore: suggestion.suggestedDataQualityScore };
    case "fleet_inconsistency":
      return { fleetSize: suggestion.suggestedFleetSize };
    default:
      return {};
  }
}
