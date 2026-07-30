// Pure, testable free-text scanning for the "Log call note" feature.
// Two independent signals are detected from the same note:
//  1. a competitor's name mentioned anywhere (case-insensitive)
//  2. a rejection phrase ("too expensive", "not interested in", ...)
//     co-occurring with a module name — read as "the rep says the
//     prospect pushed back on this module"
// Neither detector invents data: everything returned is either a direct
// substring match or derived from the company's own real fields.

import {
  competitors,
  modules,
  moduleById,
  type Company,
  type Competitor,
  type ModuleId,
} from "@/data/mock-data";
import { computeHealthScore } from "@/lib/health-score";
import { HEALTH_SCORE_AT_RISK_THRESHOLD } from "@/lib/morning-briefing";

export interface CompetitorMention {
  competitor: Competitor;
  /** Exact substring from the note that matched (preserves original casing). */
  matchedText: string;
}

export interface ModuleRejection {
  moduleId: ModuleId;
  moduleName: string;
}

export type RiskLevel = "High" | "Medium";

export interface ThreatAnalysis {
  moduleId: ModuleId;
  moduleName: string;
  competitor: Competitor;
  riskLevel: RiskLevel;
  why: string;
}

const REJECTION_PHRASES = [
  "not interested in",
  "not interested",
  "doesn't like",
  "does not like",
  "didn't like",
  "rejected",
  "too expensive",
  "won't consider",
  "wont consider",
  "not a fan of",
  "pushed back on",
];

/** First competitor name found in the note, if any. */
export function detectCompetitorMention(note: string): CompetitorMention | null {
  const lower = note.toLowerCase();
  for (const competitor of competitors) {
    const needle = competitor.name.toLowerCase();
    const index = lower.indexOf(needle);
    if (index !== -1) {
      return { competitor, matchedText: note.slice(index, index + competitor.name.length) };
    }
  }
  return null;
}

/** A rejection phrase co-occurring with a module name, if any. */
export function detectModuleRejection(note: string): ModuleRejection | null {
  const lower = note.toLowerCase();
  const hasRejectionPhrase = REJECTION_PHRASES.some((phrase) => lower.includes(phrase));
  if (!hasRejectionPhrase) return null;

  for (const mod of modules) {
    if (lower.includes(mod.name.toLowerCase())) {
      return { moduleId: mod.id, moduleName: mod.name };
    }
  }
  return null;
}

// Each of the 4 competitors is strongest in exactly 2 of the 8 modules
// (data/mock-data.ts), so this map is a full, non-overlapping 1:1 lookup.
const competitorByStrongModule = new Map<ModuleId, Competitor>();
for (const competitor of competitors) {
  for (const moduleId of competitor.strongModuleIds) {
    competitorByStrongModule.set(moduleId, competitor);
  }
}

const PRESENCE_USING_RISK = 30;
const PRESENCE_EVALUATING_RISK = 15;
const LOW_HEALTH_RISK = 20;
const HIGH_RISK_THRESHOLD = 30;

/**
 * Given a module the account just pushed back on, identifies the single
 * competitor best-positioned to exploit that gap, using the account's own
 * profile (existing competitor presence, health score, whether the module
 * is already active) to size the risk and explain why.
 */
export function analyzeThreat(
  company: Company,
  moduleId: ModuleId,
  today: string,
): ThreatAnalysis | null {
  const competitor = competitorByStrongModule.get(moduleId);
  if (!competitor) return null;

  const moduleName = moduleById.get(moduleId)!.name;
  const healthScore = computeHealthScore({
    isoCertified: company.isoCertified,
    digitalMaturity: company.digitalMaturity,
    avgResponseTimeHours: company.avgResponseTimeHours,
    dataQualityScore: company.dataQualityScore,
    lastContactDate: company.lastContactDate,
    renewalDate: company.renewalDate,
    today,
  }).score;

  const presence = company.competitorPresence;
  const alreadyPresent = presence?.competitorId === competitor.id;
  const isLowHealth = healthScore < HEALTH_SCORE_AT_RISK_THRESHOLD;
  const isMissing = company.missingModuleIds.includes(moduleId);

  let riskScore = 0;
  if (alreadyPresent) {
    riskScore += presence!.status === "using" ? PRESENCE_USING_RISK : PRESENCE_EVALUATING_RISK;
  }
  if (isLowHealth) riskScore += LOW_HEALTH_RISK;
  const riskLevel: RiskLevel = riskScore >= HIGH_RISK_THRESHOLD ? "High" : "Medium";

  const clauses = [`${competitor.name} is the strongest competing option for ${moduleName}`];
  if (alreadyPresent) {
    const monthsText = `${presence!.months} month${presence!.months === 1 ? "" : "s"}`;
    clauses.push(
      presence!.status === "using"
        ? `is already in active use at this account (${monthsText})`
        : `is already being evaluated at this account (${monthsText} in)`,
    );
  }
  if (isLowHealth) {
    clauses.push(`this account's health score (${healthScore}/100) leaves little room for error`);
  }
  if (isMissing) {
    clauses.push(`TermoFlow hasn't sold them ${moduleName} yet, so there's no incumbent advantage here`);
  }
  const why = `${clauses.join(", and ")}.`;

  return { moduleId, moduleName, competitor, riskLevel, why };
}
