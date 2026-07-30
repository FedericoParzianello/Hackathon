"use client";

import { useEffect, useMemo, type ComponentType } from "react";
import { moduleById, type Company } from "@/data/mock-data";
import { computeNextBestAction, type NextBestAction } from "@/lib/nba";
import {
  XIcon,
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  TagIcon,
  CalendarClockIcon,
  LayersIcon,
  TargetIcon,
} from "./icons";
import {
  ModulePillList,
  IsoBadge,
  ScoreMeter,
  DigitalMaturityBadge,
  TeamSplitBar,
} from "./badges";
import { HealthScoreIndicator } from "./health-score-indicator";
import { EnrichmentCard } from "./enrichment-card";
import { OutreachDraftPanel } from "./outreach-draft";

function NextBestActionCard({ company, nba }: { company: Company; nba: NextBestAction }) {
  const hasAction = nba.moduleId !== null;
  return (
    <div
      className={
        hasAction
          ? "rounded-lg border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/10"
          : "rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50"
      }
    >
      <div
        className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${
          hasAction
            ? "text-orange-700 dark:text-orange-400"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        <TargetIcon className="h-3.5 w-3.5" />
        Next Best Action
      </div>
      {hasAction && (
        <span className="mb-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25">
          Pitch: {nba.moduleName}
        </span>
      )}
      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {nba.explanation}
      </p>
      {hasAction && <OutreachDraftPanel company={company} nba={nba} />}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

export function CompanyDetailPanel({
  company,
  allCompanies,
  onClose,
  onUpdateCompany,
}: {
  company: Company;
  allCompanies: Company[];
  onClose: () => void;
  onUpdateCompany: (companyId: string, patch: Partial<Company>) => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const activeNames = company.activeModuleIds.map((id) => moduleById.get(id)!.name);
  const missingNames = company.missingModuleIds.map((id) => moduleById.get(id)!.name);
  const nba = useMemo(() => computeNextBestAction(company), [company]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex h-full w-full flex-col overflow-y-auto bg-white shadow-xl dark:bg-zinc-900 sm:w-[440px]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {company.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {company.city}
              </span>
              <span>&middot;</span>
              <span>{company.subSector}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-5 py-5">
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5 text-sm dark:bg-zinc-800/50">
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Account owner</div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                {company.repName} &middot; {company.repTerritory}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Est. ARR</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                {currencyFormatter.format(company.estimatedARR)}
              </div>
            </div>
          </div>

          <NextBestActionCard company={company} nba={nba} />

          <div className="grid grid-cols-2 gap-4">
            <HealthScoreIndicator company={company} variant="full" />
            <ScoreMeter label="Data quality" score={company.dataQualityScore} />
          </div>

          <EnrichmentCard
            company={company}
            allCompanies={allCompanies}
            onApply={(patch) => onUpdateCompany(company.id, patch)}
            key={company.id}
          />

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Years in business"
              value={`${company.yearsInBusiness} yrs`}
              icon={CalendarClockIcon}
            />
            <StatTile
              label="Fleet size"
              value={`${company.fleetSize} vehicles`}
              icon={TruckIcon}
            />
            <StatTile
              label="Avg. response time"
              value={`${company.avgResponseTimeHours}h`}
              icon={ClockIcon}
            />
            <StatTile
              label="Employees"
              value={`${company.employeeCount}`}
              icon={LayersIcon}
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Team composition
            </div>
            <TeamSplitBar
              technicians={company.technicianCount}
              office={company.officeStaffCount}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">ISO certified</span>
              <IsoBadge certified={company.isoCertified} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Digital maturity</span>
              <DigitalMaturityBadge level={company.digitalMaturity} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Renewal date</div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                {formatDate(company.renewalDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Last contact</div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                {formatDate(company.lastContactDate)}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <TagIcon className="h-3.5 w-3.5" />
              Brands managed
            </div>
            <div className="flex flex-wrap gap-1.5">
              {company.brands.map((brand) => (
                <span
                  key={brand}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Active modules
            </div>
            <ModulePillList names={activeNames} variant="active" max={activeNames.length} />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Missing modules
            </div>
            <ModulePillList names={missingNames} variant="missing" max={missingNames.length} />
          </div>
        </div>
      </div>
    </div>
  );
}
