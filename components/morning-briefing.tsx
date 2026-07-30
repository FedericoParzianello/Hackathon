import Link from "next/link";
import { TODAY_ISO, type Company } from "@/data/mock-data";
import {
  buildMorningBriefing,
  selectTopPriorities,
  type BriefingItem,
  type BriefingPillar,
} from "@/lib/morning-briefing";
import { TargetIcon, ActivityIcon, ScaleIcon, SparklesIcon, ChevronRightIcon, SunriseIcon } from "./icons";

const DISPLAYED_PRIORITY_COUNT = 8;

const pillarMeta: Record<
  BriefingPillar,
  { label: string; icon: typeof TargetIcon; className: string }
> = {
  nba: {
    label: "Next Best Action",
    icon: TargetIcon,
    className:
      "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
  },
  health: {
    label: "Health Score",
    icon: ActivityIcon,
    className:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
  },
  competitive: {
    label: "Competitive Intel",
    icon: ScaleIcon,
    className:
      "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
  },
  enrichment: {
    label: "Auto Enrich",
    icon: SparklesIcon,
    className:
      "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  },
};

function PillarBadge({ pillar }: { pillar: BriefingPillar }) {
  const meta = pillarMeta[pillar];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset ${meta.className}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function FlagBadge({ flag }: { flag: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-zinc-600 ring-1 ring-inset ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
      {flag}
    </span>
  );
}

function PriorityCard({ item }: { item: BriefingItem }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <PillarBadge pillar={item.pillar} />
          {item.flag && <FlagBadge flag={item.flag} />}
        </div>
        <div className="font-semibold text-zinc-900 dark:text-zinc-50">{item.companyName}</div>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {item.recommendation}
        </p>
      </div>
      <Link
        href={`/?company=${item.companyId}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        View company
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function formatToday(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MorningBriefing({ companies }: { companies: Company[] }) {
  const allItems = buildMorningBriefing(companies, TODAY_ISO);
  const items = selectTopPriorities(allItems, DISPLAYED_PRIORITY_COUNT);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
          <SunriseIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Good morning &mdash; here are today&apos;s top {items.length} priorities across your
            portfolio
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{formatToday(TODAY_ISO)}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Nothing urgent today &mdash; your portfolio is in good shape.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <PriorityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
