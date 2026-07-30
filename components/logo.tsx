import { FlameIcon } from "./icons";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-sm">
        <FlameIcon className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        <span className="text-zinc-900 dark:text-zinc-50">Termo</span>
        <span className="text-orange-500">Flow</span>
      </span>
    </div>
  );
}
