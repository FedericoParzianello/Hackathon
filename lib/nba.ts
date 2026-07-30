// Pure, testable "Next Best Action" heuristic — no magic numbers outside
// this file. Picks the one sellable missing module worth pitching next and
// explains why, grounded in the account's own data.

import { moduleById, type Company, type ModuleId } from "@/data/mock-data";

export interface NextBestAction {
  moduleId: ModuleId | null;
  moduleName: string | null;
  explanation: string;
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic per-company pick among phrasing variants — stable across renders. */
function pick(companyId: string, salt: string, variants: string[]): string {
  const index = hashString(`${companyId}:${salt}`) % variants.length;
  return variants[index];
}

/** A module can only be pitched once its own prerequisites are already active. */
function isSellable(moduleId: ModuleId, activeModuleIds: ModuleId[]): boolean {
  const requirement = moduleById.get(moduleId)!.requirement;
  switch (requirement.type) {
    case "none":
      return true;
    case "modules":
      return requirement.moduleIds.every((id) => activeModuleIds.includes(id));
    case "minActiveModules":
      return activeModuleIds.length >= requirement.count;
  }
}

interface Candidate {
  moduleId: ModuleId;
  priority: number;
  explanation: string;
}

function buildCandidate(moduleId: ModuleId, company: Company): Candidate {
  const {
    id,
    employeeCount,
    avgResponseTimeHours,
    digitalMaturity,
    isoCertified,
    technicianCount,
    officeStaffCount,
    healthScore,
    activeModuleIds,
    missingModuleIds,
  } = company;

  const fieldRatio = technicianCount / Math.max(1, officeStaffCount);
  const remainingAfterThis = missingModuleIds.length - 1;
  const gapNote =
    remainingAfterThis > 0
      ? `That still leaves ${remainingAfterThis} more module${remainingAfterThis === 1 ? "" : "s"} on the table after this one.`
      : "It's also the last gap in the roadmap for this account.";

  switch (moduleId) {
    case "quotes-invoicing": {
      const priority = 1000; // foundational — nothing else can be sold before this
      let explanation: string;
      if (employeeCount < 10) {
        explanation = pick(id, moduleId, [
          `${company.name} has no TermoFlow modules active yet. At ${employeeCount} employees, Quotes & Invoicing is the cheapest, fastest win before any bigger pitch. ${gapNote}`,
          `A lean ${employeeCount}-person shop with zero adoption so far — start the relationship with Quotes & Invoicing, the entry point every other module depends on.`,
        ]);
      } else {
        explanation = pick(id, moduleId, [
          `${company.name} hasn't adopted any TermoFlow module yet. Quotes & Invoicing is the required first step — every other module in the catalog depends on it being active.`,
          `With ${employeeCount} employees and no modules active, Quotes & Invoicing is the obvious opener: it unlocks the rest of the roadmap for this account.`,
        ]);
      }
      return { moduleId, priority, explanation };
    }

    case "parts-inventory": {
      let priority = 40;
      if (fieldRatio > 4) priority += 25;
      else if (fieldRatio > 2) priority += 10;
      const explanation =
        fieldRatio > 4
          ? pick(id, moduleId, [
              `${technicianCount} technicians are supported by only ${officeStaffCount} office staff — with that few people tracking stock by hand, Parts Inventory is likely overdue.`,
              `The field team (${technicianCount} techs) heavily outnumbers office staff (${officeStaffCount}). Parts Inventory gives visibility that manual tracking can't keep up with at this ratio.`,
            ])
          : pick(id, moduleId, [
              `Parts Inventory has no prerequisites and nothing is blocking it — a quick, low-friction add-on for a ${employeeCount}-employee account still tracking stock manually.`,
              `No dependency stands in the way of Parts Inventory here, and it's a natural complement to the modules already active for this ${employeeCount}-person team.`,
            ]);
      return { moduleId, priority, explanation };
    }

    case "job-management": {
      let priority = 50;
      if (avgResponseTimeHours > 12) priority += 20;
      else if (avgResponseTimeHours > 6) priority += 10;
      if (employeeCount > 30) priority += 10;
      const explanation =
        avgResponseTimeHours > 12
          ? pick(id, moduleId, [
              `Average response time is running at ${avgResponseTimeHours}h — Job Management gives dispatchers real-time visibility into crews, which is usually the fastest way to bring that down.`,
              `A ${avgResponseTimeHours}h average response time points to scheduling done by phone or spreadsheet. Job Management replaces that with live job assignment.`,
            ])
          : pick(id, moduleId, [
              `At ${employeeCount} employees, job assignment is almost certainly still manual. Job Management is the logical next step now that Quotes & Invoicing is active.`,
              `Quotes & Invoicing is already in place — Job Management is the natural follow-on to give a ${employeeCount}-person team a shared view of active jobs.`,
            ]);
      return { moduleId, priority, explanation };
    }

    case "scheduled-maintenance": {
      let priority = 45;
      if (isoCertified) priority += 20;
      if (healthScore < 50) priority += 15;
      const explanation = isoCertified
        ? pick(id, moduleId, [
            `This account is ISO certified, so process discipline is already there — Scheduled Maintenance turns that into recurring contract revenue instead of one-off callouts.`,
            `ISO certification signals a quality-driven operation. Scheduled Maintenance is an easy sell here: it formalizes work they likely already plan for internally.`,
          ])
        : healthScore < 50
          ? pick(id, moduleId, [
              `Health score is sitting at ${healthScore}/100 — a recurring Scheduled Maintenance contract gives this account a reason to engage more often, which tends to help retention.`,
              `With health at ${healthScore}/100, more frequent touchpoints matter. Scheduled Maintenance creates a built-in reason to stay in contact.`,
            ])
          : pick(id, moduleId, [
              `Job Management is already active, so Scheduled Maintenance is a natural upsell to move this account from reactive jobs to recurring contracts.`,
              `The prerequisite (Job Management) is already in place — Scheduled Maintenance is the next step toward predictable, contracted revenue.`,
            ]);
      return { moduleId, priority, explanation };
    }

    case "field-tech-app": {
      let priority = 45;
      if (fieldRatio > 3) priority += 20;
      if (digitalMaturity === "High") priority += 10;
      else if (digitalMaturity === "Low") priority += 5;
      const explanation =
        fieldRatio > 3
          ? pick(id, moduleId, [
              `${technicianCount} technicians are working off paper job sheets today with only ${officeStaffCount} office staff to relay updates — Field Tech App is a direct productivity win for a crew this size.`,
              `With ${technicianCount} techs in the field and just ${officeStaffCount} in the office, mobile access to jobs would remove a lot of back-and-forth phone calls.`,
            ])
          : digitalMaturity === "High"
            ? pick(id, moduleId, [
                `Digital maturity is already High, so a mobile Field Tech App will land easily here and reinforces the modules already adopted.`,
                `This account is already comfortable with digital tools (High maturity) — Field Tech App is a low-resistance next step for the field team.`,
              ])
            : pick(id, moduleId, [
                `Digital maturity is Low, but a simple mobile app for the ${technicianCount}-strong field team is often the easiest way to start shifting that.`,
                `Even with Low digital maturity, Field Tech App tends to be an easy first mobile tool to introduce to a field team of ${technicianCount}.`,
              ]);
      return { moduleId, priority, explanation };
    }

    case "business-intelligence": {
      let priority = 35;
      if (employeeCount > 50) priority += 25;
      else if (employeeCount > 25) priority += 10;
      if (healthScore >= 40 && healthScore < 70) priority += 10;
      const explanation =
        employeeCount > 50
          ? pick(id, moduleId, [
              `At ${employeeCount} employees and ${activeModuleIds.length} modules already live, this account generates enough data for Business Intelligence to be genuinely useful, not just a dashboard for its own sake.`,
              `${employeeCount} employees is enterprise scale for this portfolio — leadership here is likely already asking for reporting that Business Intelligence would answer directly.`,
            ])
          : pick(id, moduleId, [
              `Health score sits at ${healthScore}/100 — a BI dashboard gives the account owner concrete numbers to point to internally, which helps at renewal time.`,
              `With ${activeModuleIds.length} modules already active, there's enough data flowing for Business Intelligence to start paying for itself.`,
            ]);
      return { moduleId, priority, explanation };
    }

    case "ai-voice-agent": {
      let priority = 40;
      if (avgResponseTimeHours > 12) priority += 25;
      else if (avgResponseTimeHours > 6) priority += 10;
      if (officeStaffCount <= 3) priority += 15;
      const explanation =
        officeStaffCount <= 3
          ? pick(id, moduleId, [
              `Only ${officeStaffCount} office staff are answering calls for ${technicianCount} field techs — AI Voice Agent directly covers that gap so emergency callouts stop going to voicemail.`,
              `With just ${officeStaffCount} people on the phones, after-hours and overflow calls are likely being missed. AI Voice Agent is built for exactly this staffing shape.`,
            ])
          : pick(id, moduleId, [
              `Average response time is ${avgResponseTimeHours}h — AI Voice Agent is the next step now that Scheduled Maintenance is active, to stop missing calls during busy periods.`,
              `Scheduled Maintenance is already in place; AI Voice Agent is the natural extension to make sure a ${avgResponseTimeHours}h response window doesn't cost missed jobs.`,
            ]);
      return { moduleId, priority, explanation };
    }

    case "ai-invoice-agent": {
      let priority = 35;
      if (officeStaffCount <= 3) priority += 20;
      if (employeeCount > 40) priority += 10;
      const explanation =
        officeStaffCount <= 3
          ? pick(id, moduleId, [
              `With only ${officeStaffCount} office staff handling admin, AI Invoice Agent removes manual invoice entry that's an easy backlog to build up.`,
              `${officeStaffCount} people in the back office is a thin team for chasing invoices — AI Invoice Agent automates the part that scales worst with headcount.`,
            ])
          : pick(id, moduleId, [
              `Quotes & Invoicing is already active — AI Invoice Agent is a low-friction upsell that automates a process this ${employeeCount}-employee account already runs daily.`,
              `This account already relies on Quotes & Invoicing daily; AI Invoice Agent is the incremental step that saves admin time without changing their workflow.`,
            ]);
      return { moduleId, priority, explanation };
    }
  }
}

export function computeNextBestAction(company: Company): NextBestAction {
  if (company.missingModuleIds.length === 0) {
    return {
      moduleId: null,
      moduleName: null,
      explanation: pick(company.id, "expanded", [
        `${company.name} already runs the full TermoFlow suite. With a health score of ${company.healthScore}/100, the priority now is retention, not expansion.`,
        `Every module is already active here. Health score is ${company.healthScore}/100 — keep an eye on that number rather than pitching anything new.`,
      ]),
    };
  }

  const sellable = company.missingModuleIds.filter((id) =>
    isSellable(id, company.activeModuleIds),
  );

  if (sellable.length === 0) {
    const blockedNames = company.missingModuleIds
      .map((id) => moduleById.get(id)!.name)
      .join(", ");
    return {
      moduleId: null,
      moduleName: null,
      explanation: `No remaining module is ready to pitch yet — ${blockedNames} all require other modules to be active first.`,
    };
  }

  const winner = sellable
    .map((moduleId) => buildCandidate(moduleId, company))
    .sort((a, b) => b.priority - a.priority)[0];

  return {
    moduleId: winner.moduleId,
    moduleName: moduleById.get(winner.moduleId)!.name,
    explanation: winner.explanation,
  };
}
