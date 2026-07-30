// Fake "Auto Enrich" suggestion generator — pure and deterministic (seeded by
// company id) so the same account always produces the same demo suggestions.
// No suggestion is ever applied automatically: the UI always presents these
// as pending proposals for a human to accept or dismiss.

import type { Company } from "@/data/mock-data";
import { hashString, createRng } from "@/lib/seeded-random";

export type EnrichmentSuggestionKind =
  | "new_stakeholder"
  | "employee_count"
  | "certification"
  | "expansion_note"
  | "new_brand";

export interface EnrichmentSuggestion {
  id: string;
  kind: EnrichmentSuggestionKind;
  /** Short label for what changed. */
  headline: string;
  /** Longer supporting detail. */
  detail: string;
  /** 0-100 confidence that the suggestion is accurate. */
  confidence: number;
  source: string;
  /** ISO date the (fake) signal was detected. */
  detectedDate: string;
}

const firstNames = [
  "Elena", "Marco", "Sofia", "Jonas", "Ana", "Piotr", "Clara", "Lukas", "Ines", "Tomas",
];
const lastNames = [
  "Rossi", "Dubois", "Kowalski", "Hansen", "Silva", "Novak", "Bauer", "Costa", "Lindqvist", "Meyer",
];
const stakeholderTitles = [
  "Operations Manager", "Head of Maintenance", "Facilities Director", "Procurement Lead", "Fleet Manager",
];
const expansionPhrases = [
  "expansion into commercial HVAC contracts",
  "a new branch opening later this year",
  "entering the solar retrofit market",
  "a new 24/7 emergency call-out service",
  "expansion into a neighboring region",
];
const brandGuesses = [
  "a private-label parts brand",
  "a new maintenance-plan product line",
  "a co-branded smart thermostat offering",
];
const contactSources = ["Public business registry", "LinkedIn public profile"];
const registrySources = ["Public business registry", "Company website"];

function addDaysISO(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

interface Candidate {
  kind: EnrichmentSuggestionKind;
  headline: string;
  detail: string;
  confidence: number;
  source: string;
}

function buildCandidates(
  company: Company,
  rng: () => number,
  nextInt: (min: number, max: number) => number,
): Candidate[] {
  const name = `${firstNames[nextInt(0, firstNames.length - 1)]} ${
    lastNames[nextInt(0, lastNames.length - 1)]
  }`;
  const title = stakeholderTitles[nextInt(0, stakeholderTitles.length - 1)];

  const employeeDeltaPct = nextInt(-15, 20);
  const employeeDelta = Math.round((company.employeeCount * employeeDeltaPct) / 100) || 1;
  const suggestedEmployeeCount = Math.max(1, company.employeeCount + employeeDelta);

  const expansionPhrase = expansionPhrases[nextInt(0, expansionPhrases.length - 1)];
  const brandGuess = brandGuesses[nextInt(0, brandGuesses.length - 1)];

  const certificationCandidate: Candidate = company.isoCertified
    ? {
        kind: "certification",
        headline: "ISO certification renewal detected",
        detail: "Public registry shows the ISO 9001 certification was renewed this year.",
        confidence: nextInt(70, 90),
        source: "Public business registry",
      }
    : {
        kind: "certification",
        headline: "New certification detected: ISO 9001:2015",
        detail:
          "Company website now references an ISO 9001:2015 certification not yet recorded in your CRM.",
        confidence: nextInt(72, 95),
        source: "Company website",
      };

  return [
    {
      kind: "new_stakeholder",
      headline: `New stakeholder contact: ${name}`,
      detail: `${name} appears as ${title} in a recent update — not yet in your CRM contacts.`,
      confidence: nextInt(55, 82),
      source: contactSources[nextInt(0, contactSources.length - 1)],
    },
    {
      kind: "employee_count",
      headline: `Employee count may have changed: ${company.employeeCount} → ~${suggestedEmployeeCount}`,
      detail: `External sources suggest headcount has ${
        employeeDelta >= 0 ? "grown" : "shrunk"
      } to around ${suggestedEmployeeCount} employees.`,
      confidence: nextInt(60, 90),
      source: registrySources[nextInt(0, registrySources.length - 1)],
    },
    certificationCandidate,
    {
      kind: "expansion_note",
      headline: "Company website mentions expansion",
      detail: `Recent site content mentions ${expansionPhrase}.`,
      confidence: nextInt(50, 76),
      source: "Company website",
    },
    {
      kind: "new_brand",
      headline: "New brand or product line detected",
      detail: `Company materials reference a brand not currently listed: ${brandGuess}.`,
      confidence: nextInt(55, 80),
      source: "Industry trade directory",
    },
  ];
}

/** Deterministically produces 2-3 fake enrichment suggestions for a company. */
export function generateEnrichmentSuggestions(
  company: Company,
  today: string,
): EnrichmentSuggestion[] {
  const rng = createRng(hashString(`${company.id}:enrichment`));
  const nextInt = (min: number, max: number) =>
    min + Math.floor(rng() * (max - min + 1));

  const candidates = buildCandidates(company, rng, nextInt);
  const shuffled = [...candidates].sort(() => rng() - 0.5);
  const count = nextInt(2, 3);

  return shuffled.slice(0, count).map((candidate, index) => ({
    id: `${company.id}-enrich-${index}`,
    detectedDate: addDaysISO(today, -nextInt(0, 21)),
    ...candidate,
  }));
}
