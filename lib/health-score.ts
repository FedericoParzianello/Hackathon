// Pure, testable health score heuristic — no magic numbers outside this file.
// The score is a sum of named factors so the UI can render the full
// breakdown instead of a bare number.

import type { DigitalMaturity } from "@/data/mock-data";

export interface HealthScoreFactor {
  label: string;
  delta: number;
}

export interface HealthScoreResult {
  score: number;
  factors: HealthScoreFactor[];
}

export interface HealthScoreInput {
  isoCertified: boolean;
  digitalMaturity: DigitalMaturity;
  avgResponseTimeHours: number;
  dataQualityScore: number;
  lastContactDate: string; // ISO date (YYYY-MM-DD)
  renewalDate: string; // ISO date (YYYY-MM-DD)
  today: string; // ISO date (YYYY-MM-DD) — reference "now", passed in for determinism
}

const BASE_SCORE = 50;
const MSPD = 1000 * 60 * 60 * 24;

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / MSPD);
}

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const factors: HealthScoreFactor[] = [{ label: "Base score", delta: BASE_SCORE }];

  if (input.isoCertified) {
    factors.push({ label: "ISO certified", delta: 20 });
  }

  if (input.digitalMaturity === "High") {
    factors.push({ label: "High digital maturity", delta: 20 });
  } else if (input.digitalMaturity === "Medium") {
    factors.push({ label: "Medium digital maturity", delta: 10 });
  }

  if (input.avgResponseTimeHours < 2) {
    factors.push({ label: "Avg. response time under 2h", delta: 15 });
  } else if (input.avgResponseTimeHours < 4) {
    factors.push({ label: "Avg. response time under 4h", delta: 5 });
  }

  if (input.dataQualityScore > 80) {
    factors.push({ label: "Data quality above 80", delta: 15 });
  }

  const daysSinceContact = daysBetween(input.lastContactDate, input.today);
  if (daysSinceContact > 60) {
    factors.push({ label: "No contact in over 60 days", delta: -10 });
  }

  const daysToRenewal = daysBetween(input.today, input.renewalDate);
  if (daysToRenewal <= 30) {
    factors.push({ label: "Renewal within 30 days", delta: -15 });
  }

  const rawScore = factors.reduce((sum, factor) => sum + factor.delta, 0);
  const score = Math.min(100, Math.max(0, rawScore));

  return { score, factors };
}
