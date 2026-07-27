"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { sessionVolume, todayStr } from "@/lib/stats";
import { PROGRAM_COLORS, DEFAULT_PROGRAM_COLOR } from "@/lib/colors";

const MONTH_LABELS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WEEKDAY_LABELS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { sessions, plans, ready, removePlan } = useStore();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [selected, setSelected] = useState(todayStr());
  const [planOpen, setPlanOpen] = useState(false);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [sessions]);

  const plansByDate = useMemo(() => {
    const map = new Map<string, typeof plans>();
    for (const p of plans) {
      const arr = map.get(p.date) ?? [];
      arr.push(p);
      map.set(p.date, arr);
    }
    return map;
  }, [plans]);

  if (!ready) return null;

  const firstOfMonth = new Date(cursor.y, cursor.m, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedSessions = sessionsByDate.get(selected) ?? [];
  const selectedPlans = plansByDate.get(selected) ?? [];

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
            const daySessions = sessionsByDate.get(dateStr) ?? [];
            const dayPlans = plansByDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr();
            const isSelected = dateStr === selected;
            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 relative"
                style={{
                  background: isSelected ? "var(--surface-2)" : "transparent",
                  outline: isToday && !isSelected ? "1.5px solid var(--muted)" : "none",
                }}
              >
                <span className="text-xs font-bold">{d}</span>
                <div className="flex items-center gap-0.5 h-1.5">
                  {daySessions.slice(0, 3).map((s, si) => (
                    <span
                      key={`s${si}`}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: s.color || DEFAULT_PROGRAM_COLOR }}
                    />
                  ))}
                  {daySessions.length === 0 &&
                    dayPlans.slice(0, 3).map((p, pi) => (
                      <span
                        key={`p${pi}`}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ border: `1.5px solid ${p.color}` }}
                      />
                    ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{selected}</p>
        <button
          onClick={() => setPlanOpen(true)}
          className="text-[11px] font-bold flex items-center gap-1"
          style={{ color: "var(--accent)" }}
        >
          <Plus size={13} /> Запланировать
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {selectedSessions.length === 0 && selectedPlans.length === 0 && (
          <div className="rounded-3xl bg-surface border border-border p-4 text-sm text-muted">
            Тренировок в этот день нет
          </div>
        )}
        {selectedSessions.map((s) => (
          <Link
            key={s.id}
            href="/history"
            className="rounded-3xl bg-surface border border-border p-4 flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color || DEFAULT_PROGRAM_COLOR }} />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{s.title}</p>
              <p className="text-xs text-muted mt-0.5">{s.exercises.length} упражнений</p>
            </div>
            <p className="font-black shrink-0" style={{ color: "var(--accent)" }}>
              {sessionVolume(s).toFixed(0)} кг
            </p>
          </Link>
        ))}
        {selectedPlans.map((p) => (
          <div key={p.id} className="rounded-3xl bg-surface border border-border p-4 flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ border: `2px solid ${p.color}` }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{p.title}</p>
              <p className="text-xs text-muted mt-0.5">Запланировано</p>
            </div>
            <button onClick={() => removePlan(p.id)} className="p-1.5 text-muted shrink-0">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {planOpen && <PlanModal date={selected} onClose={() => setPlanOpen(false)} />}
    </div>
  );
}

function PlanModal({ date, onClose }: { date: string; onClose: () => void }) {
  const { programs, addPlan, startDraft, startProgram } = useStore();
  const router = useRouter();
  const [programId, setProgramId] = useState<string | null>(null);
  const [title, setTitle] = useState("Тренировка");
  const [color, setColor] = useState(DEFAULT_PROGRAM_COLOR);
  const isToday = date === todayStr();

  const selectProgram = (id: string | null) => {
    setProgramId(id);
    if (id) {
      const p = programs.find((pr) => pr.id === id);
      if (p) {
        setTitle(p.name);
        setColor(p.color);
      }
    } else {
      setTitle("Тренировка");
    }
  };

  const handleSave = () => {
    addPlan(date, programId, title.trim() || "Тренировка", color);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-w-md w-full mx-auto rounded-t-[28px] bg-background p-5 pb-[calc(24px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-black mb-4">Запланировать на {date}</h2>

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Название</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none mb-4"
        />

        {programs.length > 0 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Программа</p>
            <div className="flex flex-col gap-1.5 mb-4">
              <button
                onClick={() => selectProgram(null)}
                className="rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold bg-surface-2"
                style={{ outline: programId === null ? "2px solid var(--accent)" : "none" }}
              >
                Без программы
              </button>
              {programs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProgram(p.id)}
                  className="rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold bg-surface-2 flex items-center gap-2"
                  style={{ outline: programId === p.id ? "2px solid var(--accent)" : "none" }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Цвет</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {PROGRAM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-9 h-9 rounded-full"
              style={{ background: c, outline: color === c ? "2.5px solid var(--foreground)" : "none", outlineOffset: 2 }}
            />
          ))}
        </div>

        <button
          onClick={handleSave}
          className="w-full h-12 rounded-2xl font-bold"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          Сохранить план
        </button>
        {isToday && (
          <button
            onClick={() => {
              if (programId) startProgram(programId);
              else startDraft({ title: title.trim() || "Тренировка", color });
              onClose();
              router.push("/workout");
            }}
            className="w-full h-11 rounded-2xl font-bold text-sm mt-2 text-muted"
          >
            Начать сейчас
          </button>
        )}
      </div>
    </div>
  );
}
