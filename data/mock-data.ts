// Mock data for TermoFlow — CRM for HVAC and electrical install/maintenance companies.
// Everything below is fake, deterministic sample data for demo purposes.

import { computeHealthScore } from "@/lib/health-score";
import { hashString, createRng } from "@/lib/seeded-random";

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export type ModuleId =
  | "quotes-invoicing"
  | "job-management"
  | "scheduled-maintenance"
  | "parts-inventory"
  | "field-tech-app"
  | "business-intelligence"
  | "ai-voice-agent"
  | "ai-invoice-agent";

export type ModuleRequirement =
  | { type: "none" }
  | { type: "modules"; moduleIds: ModuleId[] }
  | { type: "minActiveModules"; count: number };

export interface Module {
  id: ModuleId;
  name: string;
  monthlyPrice: number;
  perUser?: boolean;
  requirement: ModuleRequirement;
}

export const modules: Module[] = [
  {
    id: "quotes-invoicing",
    name: "Quotes & Invoicing",
    monthlyPrice: 49,
    requirement: { type: "none" },
  },
  {
    id: "job-management",
    name: "Job Management",
    monthlyPrice: 79,
    requirement: { type: "modules", moduleIds: ["quotes-invoicing"] },
  },
  {
    id: "scheduled-maintenance",
    name: "Scheduled Maintenance",
    monthlyPrice: 89,
    requirement: { type: "modules", moduleIds: ["job-management"] },
  },
  {
    id: "parts-inventory",
    name: "Parts Inventory",
    monthlyPrice: 59,
    requirement: { type: "none" },
  },
  {
    id: "field-tech-app",
    name: "Field Tech App",
    monthlyPrice: 39,
    perUser: true,
    requirement: { type: "modules", moduleIds: ["job-management"] },
  },
  {
    id: "business-intelligence",
    name: "Business Intelligence",
    monthlyPrice: 99,
    requirement: { type: "minActiveModules", count: 2 },
  },
  {
    id: "ai-voice-agent",
    name: "AI Voice Agent",
    monthlyPrice: 129,
    requirement: { type: "modules", moduleIds: ["scheduled-maintenance"] },
  },
  {
    id: "ai-invoice-agent",
    name: "AI Invoice Agent",
    monthlyPrice: 79,
    requirement: { type: "modules", moduleIds: ["quotes-invoicing"] },
  },
];

export const moduleById: Map<ModuleId, Module> = new Map(
  modules.map((m) => [m.id, m]),
);

// ---------------------------------------------------------------------------
// Sales reps
// ---------------------------------------------------------------------------

export interface SalesRep {
  id: string;
  name: string;
  territory: string;
}

export const salesReps: SalesRep[] = [
  { id: "rep-1", name: "Laura Bennett", territory: "Northeast" },
  { id: "rep-2", name: "Marcus Ojo", territory: "Midwest" },
  { id: "rep-3", name: "Priya Patel", territory: "West Coast" },
  { id: "rep-4", name: "Danny Costa", territory: "Southeast" },
  { id: "rep-5", name: "Rachel Kim", territory: "Southwest" },
];

export const salesRepById: Map<string, SalesRep> = new Map(
  salesReps.map((r) => [r.id, r]),
);

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export type SubSector = "Boilers" | "Electrical" | "HVAC" | "Solar" | "Mixed";

interface RawCompany {
  id: string;
  name: string;
  subSector: SubSector;
  employeeCount: number;
  repId: string;
  activeModuleIds: ModuleId[];
}

const rawCompanies: RawCompany[] = [
  { id: "coastal-comfort", name: "Coastal Comfort Heating & Air", subSector: "HVAC", employeeCount: 42, repId: "rep-1", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "parts-inventory"] },
  { id: "ironclad-electrical", name: "Ironclad Electrical Services", subSector: "Electrical", employeeCount: 15, repId: "rep-2", activeModuleIds: ["quotes-invoicing", "job-management"] },
  { id: "sunrise-solar", name: "Sunrise Solar Solutions", subSector: "Solar", employeeCount: 8, repId: "rep-3", activeModuleIds: [] },
  { id: "blueflame-boiler", name: "BlueFlame Boiler Co.", subSector: "Boilers", employeeCount: 25, repId: "rep-4", activeModuleIds: ["quotes-invoicing", "ai-invoice-agent"] },
  { id: "apex-mechanical", name: "Apex Mechanical Services", subSector: "Mixed", employeeCount: 95, repId: "rep-5", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "field-tech-app", "parts-inventory", "business-intelligence"] },
  { id: "northgate-hvac", name: "Northgate HVAC Group", subSector: "HVAC", employeeCount: 60, repId: "rep-1", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "ai-voice-agent"] },
  { id: "volt-and-wire", name: "Volt & Wire Electric", subSector: "Electrical", employeeCount: 5, repId: "rep-2", activeModuleIds: [] },
  { id: "summit-boiler", name: "Summit Boiler Works", subSector: "Boilers", employeeCount: 33, repId: "rep-3", activeModuleIds: ["quotes-invoicing", "job-management", "parts-inventory"] },
  { id: "greenray-solar", name: "GreenRay Solar Install", subSector: "Solar", employeeCount: 18, repId: "rep-4", activeModuleIds: ["quotes-invoicing"] },
  { id: "premier-comfort", name: "Premier Comfort Systems", subSector: "HVAC", employeeCount: 120, repId: "rep-5", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "parts-inventory", "field-tech-app", "business-intelligence", "ai-voice-agent", "ai-invoice-agent"] },
  { id: "titan-electrical", name: "Titan Electrical Contractors", subSector: "Electrical", employeeCount: 50, repId: "rep-1", activeModuleIds: ["quotes-invoicing", "job-management", "field-tech-app", "parts-inventory"] },
  { id: "hearthstone-boiler", name: "Hearthstone Boiler Repair", subSector: "Boilers", employeeCount: 6, repId: "rep-2", activeModuleIds: ["parts-inventory"] },
  { id: "all-seasons-mechanical", name: "All-Seasons Mechanical", subSector: "Mixed", employeeCount: 72, repId: "rep-3", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "field-tech-app", "parts-inventory", "business-intelligence", "ai-invoice-agent"] },
  { id: "brightspark-electric", name: "BrightSpark Electric Co.", subSector: "Electrical", employeeCount: 20, repId: "rep-4", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "ai-invoice-agent"] },
  { id: "evergreen-hvac", name: "Evergreen HVAC Solutions", subSector: "HVAC", employeeCount: 38, repId: "rep-5", activeModuleIds: ["quotes-invoicing", "job-management"] },
  { id: "solaris-power", name: "Solaris Power & Install", subSector: "Solar", employeeCount: 11, repId: "rep-1", activeModuleIds: [] },
  { id: "redwood-heating", name: "Redwood Heating & Cooling", subSector: "HVAC", employeeCount: 27, repId: "rep-2", activeModuleIds: ["quotes-invoicing", "parts-inventory"] },
  { id: "circuitpro-electrical", name: "CircuitPro Electrical", subSector: "Electrical", employeeCount: 14, repId: "rep-3", activeModuleIds: ["quotes-invoicing"] },
  { id: "steamline-boiler", name: "Steamline Boiler Services", subSector: "Boilers", employeeCount: 45, repId: "rep-4", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "parts-inventory"] },
  { id: "horizon-solar", name: "Horizon Solar Partners", subSector: "Solar", employeeCount: 63, repId: "rep-5", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "field-tech-app"] },
  { id: "pinnacle-comfort", name: "Pinnacle Comfort HVAC", subSector: "HVAC", employeeCount: 9, repId: "rep-1", activeModuleIds: ["quotes-invoicing"] },
  { id: "copperline-electric", name: "Copperline Electric", subSector: "Electrical", employeeCount: 110, repId: "rep-2", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "field-tech-app", "parts-inventory", "ai-voice-agent"] },
  { id: "old-town-boiler", name: "Old Town Boiler & Heat", subSector: "Boilers", employeeCount: 4, repId: "rep-3", activeModuleIds: [] },
  { id: "meridian-mechanical", name: "Meridian Mechanical Group", subSector: "Mixed", employeeCount: 84, repId: "rep-4", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "field-tech-app", "parts-inventory"] },
  { id: "freshair-hvac", name: "FreshAir HVAC Experts", subSector: "HVAC", employeeCount: 22, repId: "rep-5", activeModuleIds: ["quotes-invoicing", "job-management", "parts-inventory"] },
  { id: "wattworks-electrical", name: "WattWorks Electrical", subSector: "Electrical", employeeCount: 31, repId: "rep-1", activeModuleIds: ["quotes-invoicing", "ai-invoice-agent"] },
  { id: "bedrock-boiler", name: "Bedrock Boiler Co.", subSector: "Boilers", employeeCount: 17, repId: "rep-2", activeModuleIds: ["quotes-invoicing", "job-management"] },
  { id: "sunpeak-solar", name: "SunPeak Solar Services", subSector: "Solar", employeeCount: 55, repId: "rep-3", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "parts-inventory", "ai-invoice-agent"] },
  { id: "allweather-hvac-electrical", name: "Allweather HVAC & Electrical", subSector: "Mixed", employeeCount: 130, repId: "rep-4", activeModuleIds: ["quotes-invoicing", "job-management", "scheduled-maintenance", "parts-inventory", "field-tech-app", "business-intelligence", "ai-voice-agent", "ai-invoice-agent"] },
  { id: "ridgeline-boiler", name: "Ridgeline Boiler Services", subSector: "Boilers", employeeCount: 12, repId: "rep-5", activeModuleIds: ["quotes-invoicing"] },
];

export type DigitalMaturity = "Low" | "Medium" | "High";

export interface Company extends RawCompany {
  missingModuleIds: ModuleId[];
  estimatedARR: number;
  repName: string;
  repTerritory: string;
  brands: string[];
  city: string;
  technicianCount: number;
  officeStaffCount: number;
  isoCertified: boolean;
  yearsInBusiness: number;
  fleetSize: number;
  avgResponseTimeHours: number;
  digitalMaturity: DigitalMaturity;
  healthScore: number;
  renewalDate: string;
  dataQualityScore: number;
  lastContactDate: string;
}

/** Rough share of employees who work as field techs (drives per-user pricing). */
function estimateFieldTechs(employeeCount: number): number {
  return Math.max(1, Math.round(employeeCount * 0.55));
}

function computeMissingModules(activeModuleIds: ModuleId[]): ModuleId[] {
  return modules
    .map((m) => m.id)
    .filter((id) => !activeModuleIds.includes(id));
}

function computeEstimatedARR(company: RawCompany): number {
  const monthlyTotal = company.activeModuleIds.reduce((sum, id) => {
    const mod = moduleById.get(id)!;
    const seats = mod.perUser ? estimateFieldTechs(company.employeeCount) : 1;
    return sum + mod.monthlyPrice * seats;
  }, 0);
  return Math.round(monthlyTotal * 12);
}

// ---------------------------------------------------------------------------
// Demo profile fields (technicians, fleet, health, etc.)
//
// Deterministic pseudo-random generation seeded by company id, so the seed
// data is stable across runs/builds without hand-authoring 30 rows of values.
// ---------------------------------------------------------------------------

export const TODAY_ISO = "2026-07-30";

const brandCatalog = [
  "ThermoNova",
  "VoltEdge",
  "HeatCraft",
  "PowerLine Systems",
  "ClimaTech",
  "Amperion",
  "FlameGuard",
  "CircuitMax",
  "AeroTherm",
  "WattForge",
];

const europeanCities = [
  "Milan, Italy",
  "Barcelona, Spain",
  "Lyon, France",
  "Rotterdam, Netherlands",
  "Munich, Germany",
  "Kraków, Poland",
  "Porto, Portugal",
  "Gothenburg, Sweden",
  "Antwerp, Belgium",
  "Zurich, Switzerland",
  "Vienna, Austria",
  "Bratislava, Slovakia",
  "Turin, Italy",
  "Valencia, Spain",
  "Lille, France",
  "Eindhoven, Netherlands",
  "Stuttgart, Germany",
  "Wrocław, Poland",
  "Lisbon, Portugal",
  "Malmö, Sweden",
  "Ghent, Belgium",
  "Geneva, Switzerland",
  "Graz, Austria",
  "Brno, Czech Republic",
  "Bologna, Italy",
  "Seville, Spain",
  "Marseille, France",
  "Utrecht, Netherlands",
  "Hamburg, Germany",
  "Gdańsk, Poland",
];

function addDaysISO(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

interface DemoProfile {
  brands: string[];
  city: string;
  technicianCount: number;
  officeStaffCount: number;
  isoCertified: boolean;
  yearsInBusiness: number;
  fleetSize: number;
  avgResponseTimeHours: number;
  digitalMaturity: DigitalMaturity;
  healthScore: number;
  renewalDate: string;
  dataQualityScore: number;
  lastContactDate: string;
}

function computeDemoProfile(raw: RawCompany, index: number): DemoProfile {
  const rng = createRng(hashString(raw.id));
  const nextInt = (min: number, max: number) =>
    min + Math.floor(rng() * (max - min + 1));
  const nextFloat = (min: number, max: number, decimals = 1) => {
    const value = min + rng() * (max - min);
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  };

  const brandCount = nextInt(1, 5);
  const shuffledBrands = [...brandCatalog].sort(() => rng() - 0.5);
  const brands = shuffledBrands.slice(0, brandCount);

  const city = europeanCities[index % europeanCities.length];

  const technicianShare = nextFloat(0.7, 0.85, 2);
  const technicianCount = Math.max(
    1,
    Math.round(raw.employeeCount * technicianShare),
  );
  const officeStaffCount = Math.max(0, raw.employeeCount - technicianCount);

  const isoCertified = rng() < 0.45;
  const yearsInBusiness = nextInt(3, 45);
  const fleetSize = Math.max(1, Math.round(technicianCount / nextFloat(2, 4, 1)));
  const avgResponseTimeHours = nextFloat(1.5, 36, 1);
  const digitalMaturity: DigitalMaturity = (["Low", "Medium", "High"] as const)[
    nextInt(0, 2)
  ];
  const renewalDate = addDaysISO(TODAY_ISO, nextInt(30, 420));
  const dataQualityScore = nextInt(20, 100);
  const lastContactDate = addDaysISO(TODAY_ISO, -nextInt(1, 180));
  const { score: healthScore } = computeHealthScore({
    isoCertified,
    digitalMaturity,
    avgResponseTimeHours,
    dataQualityScore,
    lastContactDate,
    renewalDate,
    today: TODAY_ISO,
  });

  return {
    brands,
    city,
    technicianCount,
    officeStaffCount,
    isoCertified,
    yearsInBusiness,
    fleetSize,
    avgResponseTimeHours,
    digitalMaturity,
    healthScore,
    renewalDate,
    dataQualityScore,
    lastContactDate,
  };
}

export const companies: Company[] = rawCompanies.map((raw, index) => {
  const rep = salesRepById.get(raw.repId)!;
  return {
    ...raw,
    missingModuleIds: computeMissingModules(raw.activeModuleIds),
    estimatedARR: computeEstimatedARR(raw),
    repName: rep.name,
    repTerritory: rep.territory,
    ...computeDemoProfile(raw, index),
  };
});

export const companyById: Map<string, Company> = new Map(
  companies.map((c) => [c.id, c]),
);

// ---------------------------------------------------------------------------
// Interest signals (last 30 days)
// ---------------------------------------------------------------------------

export type SignalType = "interest_click" | "webinar_question" | "page_visit";

export const signalScores: Record<SignalType, number> = {
  interest_click: 40,
  webinar_question: 20,
  page_visit: 8,
};

interface RawSignal {
  id: string;
  companyId: string;
  moduleId: ModuleId;
  type: SignalType;
  date: string; // ISO date, within the last 30 days
  contactName: string;
}

const rawSignals: RawSignal[] = [
  { id: "sig-01", companyId: "coastal-comfort", moduleId: "ai-voice-agent", type: "webinar_question", date: "2026-07-15", contactName: "Mike Reyes" },
  { id: "sig-02", companyId: "apex-mechanical", moduleId: "ai-voice-agent", type: "interest_click", date: "2026-07-16", contactName: "Dana Kowalski" },
  { id: "sig-03", companyId: "steamline-boiler", moduleId: "ai-voice-agent", type: "page_visit", date: "2026-07-10", contactName: "Tom Reilly" },
  { id: "sig-04", companyId: "horizon-solar", moduleId: "ai-voice-agent", type: "interest_click", date: "2026-07-22", contactName: "Nina Alvarez" },
  { id: "sig-05", companyId: "meridian-mechanical", moduleId: "ai-voice-agent", type: "webinar_question", date: "2026-07-15", contactName: "Carlos Mendes" },
  { id: "sig-06", companyId: "ironclad-electrical", moduleId: "ai-invoice-agent", type: "interest_click", date: "2026-07-18", contactName: "Sarah Byrne" },
  { id: "sig-07", companyId: "summit-boiler", moduleId: "ai-invoice-agent", type: "page_visit", date: "2026-07-05", contactName: "Gary Okafor" },
  { id: "sig-08", companyId: "evergreen-hvac", moduleId: "ai-invoice-agent", type: "interest_click", date: "2026-07-25", contactName: "Wendy Zhao" },
  { id: "sig-09", companyId: "greenray-solar", moduleId: "business-intelligence", type: "page_visit", date: "2026-07-12", contactName: "Felix Novak" },
  { id: "sig-10", companyId: "pinnacle-comfort", moduleId: "parts-inventory", type: "page_visit", date: "2026-07-08", contactName: "Owen Fitzgerald" },
];

export interface Signal extends RawSignal {
  score: number;
}

export const signals: Signal[] = rawSignals.map((raw) => ({
  ...raw,
  score: signalScores[raw.type],
}));

// ---------------------------------------------------------------------------
// Webinar
// ---------------------------------------------------------------------------

export interface WebinarAttendee {
  contactName: string;
  companyId: string;
  minutesWatched: number;
  questionsAsked: number;
}

export interface Webinar {
  topic: string;
  date: string;
  durationMinutes: number;
  attendees: WebinarAttendee[];
}

export const webinar: Webinar = {
  topic: "AI Voice Agent: Never Miss Another Emergency Call Again",
  date: "2026-07-15",
  durationMinutes: 45,
  attendees: [
    { contactName: "Mike Reyes", companyId: "coastal-comfort", minutesWatched: 42, questionsAsked: 1 },
    { contactName: "Carlos Mendes", companyId: "meridian-mechanical", minutesWatched: 45, questionsAsked: 1 },
    { contactName: "Priya Anand", companyId: "copperline-electric", minutesWatched: 38, questionsAsked: 1 },
    { contactName: "Dana Kowalski", companyId: "apex-mechanical", minutesWatched: 40, questionsAsked: 0 },
    { contactName: "Nina Alvarez", companyId: "horizon-solar", minutesWatched: 33, questionsAsked: 0 },
    { contactName: "Wendy Zhao", companyId: "evergreen-hvac", minutesWatched: 15, questionsAsked: 0 },
    { contactName: "Felix Novak", companyId: "greenray-solar", minutesWatched: 29, questionsAsked: 0 },
    { contactName: "Owen Fitzgerald", companyId: "pinnacle-comfort", minutesWatched: 8, questionsAsked: 0 },
  ],
};
