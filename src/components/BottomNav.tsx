"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, History, House, BarChart3 } from "lucide-react";

const items = [
  { href: "/", label: "Сегодня", icon: House },
  { href: "/workout", label: "Тренировка", icon: Dumbbell },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/history", label: "История", icon: History },
  { href: "/stats", label: "Статистика", icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto max-w-md rounded-[28px] border border-border bg-surface/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-2 py-2 flex items-center justify-between">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.8}
                color={active ? "var(--accent)" : "var(--muted)"}
              />
              <span
                className="text-[10px] font-semibold tracking-tight"
                style={{ color: active ? "var(--foreground)" : "var(--muted)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
