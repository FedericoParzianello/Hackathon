"use client";

import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { navItems } from "./sidebar";

export function Header() {
  const pathname = usePathname();
  const currentLabel = navItems.find((item) => item.href === pathname)?.label ?? "Companies";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="hidden text-sm text-zinc-300 dark:text-zinc-700 sm:inline">/</span>
        <span className="hidden text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:inline">
          {currentLabel}
        </span>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
        FP
      </div>
    </header>
  );
}
