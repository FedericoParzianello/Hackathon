import type { BriefingPillar } from "@/lib/morning-briefing";
import { TargetIcon, ActivityIcon, ScaleIcon, SparklesIcon } from "./icons";

export const pillarMeta: Record<
  BriefingPillar,
  { label: string; icon: typeof TargetIcon; className: string; dotClassName: string }
> = {
  nba: {
    label: "Next Best Action",
    icon: TargetIcon,
    className:
      "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    dotClassName: "bg-orange-500",
  },
  health: {
    label: "Health Score",
    icon: ActivityIcon,
    className:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    dotClassName: "bg-red-500",
  },
  competitive: {
    label: "Competitive Intel",
    icon: ScaleIcon,
    className:
      "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
    dotClassName: "bg-violet-500",
  },
  enrichment: {
    label: "Auto Enrich",
    icon: SparklesIcon,
    className:
      "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
    dotClassName: "bg-sky-500",
  },
};

export function PillarBadge({ pillar }: { pillar: BriefingPillar }) {
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
