import { companies, moduleById, type ModuleId } from "@/data/mock-data";

function moduleNames(ids: ModuleId[]): string {
  if (ids.length === 0) return "—";
  return ids.map((id) => moduleById.get(id)!.name).join(", ");
}

function healthBadgeClass(score: number): string {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  if (score >= 70) {
    return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300`;
  }
  if (score >= 40) {
    return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300`;
  }
  return `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300`;
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-10 dark:bg-black sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          TermoFlow — Client Accounts
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {companies.length} companies in the portfolio
        </p>

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Company
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  City
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Sub-sector
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Employees
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  ISO
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Health
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Active modules
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Missing modules
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr
                  key={company.id}
                  className={`border-b border-zinc-100 last:border-0 dark:border-zinc-900 ${
                    index % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-950" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                    {company.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {company.city}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {company.subSector}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {company.employeeCount}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {company.isoCertified ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        ISO
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={healthBadgeClass(company.healthScore)}>
                      {company.healthScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {moduleNames(company.activeModuleIds)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">
                    {moduleNames(company.missingModuleIds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
