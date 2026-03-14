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
    <aside className="flex w-44 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg px-3 py-4">
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-active text-foreground"
                  : "text-muted hover:bg-sidebar-active hover:text-foreground"
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
