"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { sessionVolume, todayStr } from "@/lib/stats";

const MONTH_LABELS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WEEKDAY_LABELS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { sessions, ready } = useStore();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [selected, setSelected] = useState(todayStr());

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [sessions]);

  if (!ready) return null;

  const firstOfMonth = new Date(cursor.y, cursor.m, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedSessions = sessionsByDate.get(selected) ?? [];

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-black mb-4">Календарь</h1>

      <div className="rounded-3xl bg-surface border border-border p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
            className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="font-bold">
            {MONTH_LABELS[cursor.m]} {cursor.y}
          </p>
          <button
            onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
            className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-center text-[10px] font-bold text-muted">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const dateStr = toDateStr(cursor.y, cursor.m, d);
            const has = sessionsByDate.has(dateStr);
            const isToday = dateStr === todayStr();
            const isSelected = dateStr === selected;
            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                className="aspect-square rounded-xl flex items-center justify-center text-xs font-bold relative"
                style={{
                  background: isSelected ? "var(--accent)" : has ? "var(--surface-2)" : "transparent",
                  color: isSelected ? "var(--accent-foreground)" : "var(--foreground)",
                  outline: isToday && !isSelected ? "1.5px solid var(--muted)" : "none",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">{selected}</p>
      <div className="flex flex-col gap-2">
        {selectedSessions.length === 0 && (
          <div className="rounded-3xl bg-surface border border-border p-4 text-sm text-muted">
            Тренировок в этот день нет
          </div>
        )}
        {selectedSessions.map((s) => (
          <Link
            key={s.id}
            href="/history"
            className="rounded-3xl bg-surface border border-border p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-bold">{s.title}</p>
              <p className="text-xs text-muted mt-0.5">{s.exercises.length} упражнений</p>
            </div>
            <p className="font-black" style={{ color: "var(--accent)" }}>
              {sessionVolume(s).toFixed(0)} кг
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
