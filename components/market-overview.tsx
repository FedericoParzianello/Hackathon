import {
  modules,
  competitors,
  type Company,
  type ModuleId,
  type PricingPosition,
} from "@/data/mock-data";
import { CheckCircleIcon } from "./icons";

const thClass =
  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const pricingLabel: Record<PricingPosition, string> = {
  cheaper: "Cheaper",
  similar: "Similar",
  premium: "Premium",
};

const pricingClass: Record<PricingPosition, string> = {
  cheaper:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  similar:
    "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  premium:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
};

function PricingBadge({ position }: { position: PricingPosition }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${pricingClass[position]}`}
    >
      {pricingLabel[position]} vs TermoFlow
    </span>
  );
}

interface Vendor {
  id: string;
  name: string;
  pricing: PricingPosition | "baseline";
  strongModuleIds: ModuleId[];
}

function ComparisonTable() {
  const vendors: Vendor[] = [
    {
      id: "termoflow",
      name: "TermoFlow",
      pricing: "baseline",
      strongModuleIds: modules.map((m) => m.id),
    },
    ...competitors.map((c) => ({
      id: c.id,
      name: c.name,
      pricing: c.pricingPosition,
      strongModuleIds: c.strongModuleIds,
    })),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <th className={thClass}>Vendor</th>
              <th className={thClass}>Pricing</th>
              {modules.map((m) => (
                <th key={m.id} className={`${thClass} text-center whitespace-nowrap`}>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {vendors.map((vendor) => {
              const isTermoFlow = vendor.id === "termoflow";
              return (
                <tr
                  key={vendor.id}
                  className={
                    isTermoFlow
                      ? "bg-orange-50/50 dark:bg-orange-500/5"
                      : "bg-white dark:bg-zinc-950"
                  }
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                    {vendor.name}
                  </td>
                  <td className="px-4 py-3">
                    {isTermoFlow ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                        Baseline
                      </span>
                    ) : (
                      <PricingBadge position={vendor.pricing as PricingPosition} />
                    )}
                  </td>
                  {modules.map((m) => {
                    const strong = vendor.strongModuleIds.includes(m.id);
                    return (
                      <td key={m.id} className="px-4 py-3 text-center">
                        {strong ? (
                          <CheckCircleIcon
                            className={`mx-auto h-4 w-4 ${
                              isTermoFlow
                                ? "text-orange-500"
                                : "text-emerald-500 dark:text-emerald-400"
                            }`}
                          />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const exposureColor: Record<string, string> = {
  none: "bg-orange-500",
  "fieldpoint-suite": "bg-sky-500",
  servicegrid: "bg-violet-500",
  "heatops-cloud": "bg-teal-500",
  maintainiq: "bg-fuchsia-500",
};

function ExposureBreakdown({ companies }: { companies: Company[] }) {
  const total = companies.length;

  const noneBucket = {
    id: "none",
    name: "No known competitor (pure opportunity)",
    count: companies.filter((c) => c.competitorPresence === null).length,
    using: 0,
    evaluating: 0,
  };

  const competitorBuckets = competitors.map((comp) => {
    const exposed = companies.filter(
      (c) => c.competitorPresence?.competitorId === comp.id,
    );
    return {
      id: comp.id,
      name: comp.name,
      count: exposed.length,
      using: exposed.filter((c) => c.competitorPresence!.status === "using").length,
      evaluating: exposed.filter((c) => c.competitorPresence!.status === "evaluating")
        .length,
    };
  });

  const buckets = [noneBucket, ...competitorBuckets];

  return (
    <div className="space-y-4">
      {buckets.map((bucket) => {
        const pct = total === 0 ? 0 : Math.round((bucket.count / total) * 100);
        return (
          <div key={bucket.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${exposureColor[bucket.id]}`}
                />
                {bucket.name}
              </span>
              <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                {bucket.count} of {total} ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${exposureColor[bucket.id]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {bucket.id !== "none" && bucket.count > 0 && (
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {bucket.using} using &middot; {bucket.evaluating} evaluating
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BattlecardGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {competitors.map((comp) => (
        <div
          key={comp.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{comp.name}</h3>
            <PricingBadge position={comp.pricingPosition} />
          </div>

          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Strengths
            </div>
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {comp.strengths.map((s) => (
                <li key={s} className="flex gap-1.5">
                  <span className="text-emerald-500 dark:text-emerald-400">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Weaknesses
            </div>
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {comp.weaknesses.map((w) => (
                <li key={w} className="flex gap-1.5">
                  <span className="text-red-500 dark:text-red-400">−</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-3 dark:border-orange-500/20 dark:bg-orange-500/10">
            <div className="mb-1 text-xs font-semibold text-orange-700 dark:text-orange-400">
              How to win
            </div>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {comp.howToWin}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketOverview({ companies }: { companies: Company[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Market</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          How TermoFlow compares to the competition, and where your {companies.length}{" "}
          accounts stand today.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Feature comparison
        </h2>
        <ComparisonTable />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Account exposure
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <ExposureBreakdown companies={companies} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Battlecards
        </h2>
        <BattlecardGrid />
      </section>
    </div>
  );
}
