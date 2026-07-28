"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListChecks, History, House, BarChart3 } from "lucide-react";

const items = [
  { href: "/", label: "Сегодня", icon: House },
  { href: "/programs", label: "Программы", icon: ListChecks },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/history", label: "История", icon: History },
  { href: "/stats", label: "Статистика", icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const setHeight = () => {
      document.documentElement.style.setProperty("--nav-height", `${el.offsetHeight}px`);
    };

    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav ref={navRef} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-1.5">
      <div className="mx-auto max-w-md rounded-[24px] border border-border bg-surface/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-2 py-1.5 flex items-center justify-between">
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
