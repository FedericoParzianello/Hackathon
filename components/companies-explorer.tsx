"use client";

import { useMemo, useState } from "react";
import {
  moduleById,
  modules,
  type Company,
  type ModuleId,
} from "@/data/mock-data";
import { SearchIcon, MapPinIcon, ChevronRightIcon } from "./icons";
import { ModulePillList, IsoBadge, CompactMeter } from "./badges";
import { CompanyDetailPanel } from "./company-detail-panel";

type ModuleFilter = "all" | ModuleId;

const selectClass =
  "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

const thClass =
  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

function moduleNames(ids: ModuleId[]): string[] {
  return ids.map((id) => moduleById.get(id)!.name);
}

function parseCity(city: string): { city: string; country: string } {
  const [cityPart, countryPart] = city.split(", ");
  return { city: cityPart, country: countryPart ?? cityPart };
}

function matchesLocation(company: Company, locationFilter: string): boolean {
  if (locationFilter === "all") return true;
  if (locationFilter.startsWith("country:")) {
    const country = locationFilter.slice("country:".length);
    return parseCity(company.city).country === country;
  }
  if (locationFilter.startsWith("city:")) {
    const city = locationFilter.slice("city:".length);
    return company.city === city;
  }
  return true;
}

export function CompaniesExplorer({ companies }: { companies: Company[] }) {
  const [query, setQuery] = useState("");
  const [activeModuleFilter, setActiveModuleFilter] = useState<ModuleFilter>("all");
  const [missingModuleFilter, setMissingModuleFilter] = useState<ModuleFilter>("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const locationGroups = useMemo(() => {
    const byCountry = new Map<string, Set<string>>();
    for (const company of companies) {
      const { city, country } = parseCity(company.city);
      if (!byCountry.has(country)) byCountry.set(country, new Set());
      byCountry.get(country)!.add(city);
    }
    return Array.from(byCountry.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, cities]) => ({
        country,
        cities: Array.from(cities).sort(),
      }));
  }, [companies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((company) => {
      if (q && !company.name.toLowerCase().includes(q)) return false;
      if (
        activeModuleFilter !== "all" &&
        !company.activeModuleIds.includes(activeModuleFilter)
      )
        return false;
      if (
        missingModuleFilter !== "all" &&
        !company.missingModuleIds.includes(missingModuleFilter)
      )
        return false;
      if (!matchesLocation(company, locationFilter)) return false;
      return true;
    });
  }, [companies, query, activeModuleFilter, missingModuleFilter, locationFilter]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const hasActiveFilters =
    query !== "" ||
    activeModuleFilter !== "all" ||
    missingModuleFilter !== "all" ||
    locationFilter !== "all";

  function resetFilters() {
    setQuery("");
    setActiveModuleFilter("all");
    setMissingModuleFilter("all");
    setLocationFilter("all");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Companies
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {filtered.length}
            </span>{" "}
            companies shown
            {filtered.length !== companies.length && (
              <span> out of {companies.length} total</span>
            )}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies by name..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-900"
          />
        </div>

        <select
          value={activeModuleFilter}
          onChange={(event) => setActiveModuleFilter(event.target.value as ModuleFilter)}
          className={selectClass}
        >
          <option value="all">Any active module</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              Has {m.name}
            </option>
          ))}
        </select>

        <select
          value={missingModuleFilter}
          onChange={(event) => setMissingModuleFilter(event.target.value as ModuleFilter)}
          className={selectClass}
        >
          <option value="all">Any missing module</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              Missing {m.name}
            </option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(event) => setLocationFilter(event.target.value)}
          className={selectClass}
        >
          <option value="all">All locations</option>
          {locationGroups.map((group) => (
            <optgroup key={group.country} label={group.country}>
              <option value={`country:${group.country}`}>All of {group.country}</option>
              {group.cities.map((city) => (
                <option key={city} value={`city:${city}, ${group.country}`}>
                  {city}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                <th className={thClass}>Company</th>
                <th className={thClass}>City</th>
                <th className={thClass}>Sub-sector</th>
                <th className={thClass}>Employees</th>
                <th className={thClass}>ISO</th>
                <th className={thClass}>Health</th>
                <th className={thClass}>Active modules</th>
                <th className={thClass}>Missing modules</th>
                <th className={thClass}>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {filtered.map((company) => (
                <tr
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className="cursor-pointer bg-white transition-colors hover:bg-orange-50/60 dark:bg-zinc-950 dark:hover:bg-zinc-900/80"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {company.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {company.city}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {company.subSector}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {company.employeeCount}
                  </td>
                  <td className="px-4 py-3">
                    <IsoBadge certified={company.isoCertified} />
                  </td>
                  <td className="px-4 py-3">
                    <CompactMeter score={company.healthScore} />
                  </td>
                  <td className="px-4 py-3">
                    <ModulePillList
                      names={moduleNames(company.activeModuleIds)}
                      variant="active"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ModulePillList
                      names={moduleNames(company.missingModuleIds)}
                      variant="missing"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRightIcon className="h-4 w-4 text-zinc-300 dark:text-zinc-700" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No companies match these filters.
          </div>
        )}
      </div>

      {selectedCompany && (
        <CompanyDetailPanel
          company={selectedCompany}
          onClose={() => setSelectedCompanyId(null)}
        />
      )}
    </div>
  );
}
