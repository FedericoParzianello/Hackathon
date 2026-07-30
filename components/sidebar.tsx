"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BuildingIcon,
  ScaleIcon,
  MegaphoneIcon,
  CalendarIcon,
  BarChartIcon,
} from "./icons";
import type { ComponentType } from "react";

interface NavItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
}

export const navItems: NavItem[] = [
  { label: "Companies", icon: BuildingIcon, href: "/" },
  { label: "Market", icon: ScaleIcon, href: "/market" },
  { label: "Campaigns", icon: MegaphoneIcon },
  { label: "My Week", icon: CalendarIcon },
  { label: "Reports", icon: BarChartIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-14 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 py-4 md:w-60">
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.href) {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={
                  isActive
                    ? "flex items-center gap-3 rounded-lg bg-orange-500/10 px-2.5 py-2 text-sm font-medium text-orange-400 ring-1 ring-inset ring-orange-500/20 md:px-3"
                    : "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 md:px-3"
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          }
          return (
            <div
              key={item.label}
              className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-zinc-500 md:px-3"
              title={`${item.label} — coming soon`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </span>
              <span className="hidden rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 md:inline">
                Soon
              </span>
            </div>
          );
        })}
      </nav>
      <div className="hidden px-4 py-2 text-[11px] text-zinc-600 md:block">
        TermoFlow demo
      </div>
    </aside>
  );
}
