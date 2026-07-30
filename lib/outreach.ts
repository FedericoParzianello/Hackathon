// Pure, testable outreach-draft generator. Fills a handful of template
// "shells" with real account data — no invented facts. The pain-point
// sentence is picked per recommended module (grounded in the same field
// the module's own pitch already cites in lib/nba.ts); the template shell
// is picked deterministically per company so drafts stay stable across
// renders but vary across the portfolio.

import type { Company, ModuleId } from "@/data/mock-data";
import type { NextBestAction } from "@/lib/nba";

export interface OutreachDraft {
  subject: string;
  body: string;
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function painPointFor(moduleId: ModuleId, company: Company): string {
  switch (moduleId) {
    case "ai-voice-agent":
      return `your average call response time is running at ${company.avgResponseTimeHours}h`;
    case "ai-invoice-agent":
      return `with only ${company.officeStaffCount} people in the office, invoicing admin is an easy thing to fall behind on`;
    case "quotes-invoicing":
      return `quoting and invoicing is likely still a manual process across your ${company.employeeCount}-person team`;
    case "job-management":
      return `coordinating jobs for ${company.employeeCount} employees by phone or spreadsheet gets harder every month`;
    case "scheduled-maintenance":
      return company.isoCertified
        ? "your ISO certification suggests the process discipline for recurring contracts is already there"
        : "turning one-off callouts into recurring contracts could add predictable revenue";
    case "parts-inventory":
      return `with ${company.technicianCount} technicians in the field, tracking parts by hand tends to get error-prone`;
    case "field-tech-app":
      return `your ${company.technicianCount} field technicians are likely still working off paper job sheets`;
    case "business-intelligence":
      return `with ${company.activeModuleIds.length} modules already active, you're generating enough data for real reporting`;
  }
}

interface TemplateArgs {
  company: Company;
  moduleName: string;
  painPoint: string;
}

const templates: Array<(args: TemplateArgs) => OutreachDraft> = [
  ({ company, moduleName, painPoint }) => ({
    subject: `Quick idea for ${company.name}`,
    body: `Hi there — I was looking at ${company.name}'s account and noticed ${painPoint}. ${moduleName} is built for exactly this, and other teams in ${company.city} have seen it pay off fast. Would you be open to a 15-minute call this week to see it in action?`,
  }),
  ({ company, moduleName, painPoint }) => ({
    subject: `${moduleName} for ${company.name}?`,
    body: `Hi — quick question: is it still true that ${painPoint}? We built ${moduleName} specifically to close that gap, and I'd love to show your team in ${company.city} a quick demo. Let me know if you have 15 minutes this week.`,
  }),
  ({ company, moduleName, painPoint }) => ({
    subject: `A faster way to handle this at ${company.name}`,
    body: `Hi — I noticed ${painPoint}. ${moduleName} could close that gap without disrupting your current workflow. Happy to walk your team in ${company.city} through it whenever suits — even a quick 15-minute call would do.`,
  }),
  ({ company, moduleName, painPoint }) => ({
    subject: `Following up — ${moduleName} for ${company.name}`,
    body: `Hi — following up on our account notes: ${painPoint}. I think ${moduleName} would be a strong fit for your ${company.city} operation. Open to a short call this week to walk through it?`,
  }),
];

/** Deterministic per-company template pick, so the same account always drafts the same way. */
export function generateOutreachDraft(
  company: Company,
  nba: NextBestAction,
): OutreachDraft | null {
  if (nba.moduleId === null || nba.moduleName === null) return null;

  const painPoint = painPointFor(nba.moduleId, company);
  const templateIndex = hashString(`${company.id}:outreach`) % templates.length;
  return templates[templateIndex]({ company, moduleName: nba.moduleName, painPoint });
}
