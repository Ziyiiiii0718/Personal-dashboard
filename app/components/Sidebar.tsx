"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/todo", label: "Todo" },
  { href: "/calendar", label: "Calendar" },
  { href: "/fitness", label: "Fitness" },
  { href: "/weight", label: "Weight" },
  { href: "/diet", label: "Diet" },
  { href: "/goals", label: "Goals" },
  { href: "/recipes", label: "Recipes" },
  { href: "/diary", label: "Diary" },
  { href: "/settings", label: "Settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-44 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/80 px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-200/90 text-zinc-900 dark:bg-zinc-700/80 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
