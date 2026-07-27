"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, ArrowRight, ChevronRight, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { useProfile } from "@/lib/profile";
import {
  computeStreak,
  currentWeekDates,
  formatVolume,
  sessionsThisWeek,
  totalVolumeThisWeek,
  todayStr,
} from "@/lib/stats";

const WEEKDAY_LABELS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
const WEEKLY_GOAL = 5;

export default function TodayPage() {
  const { sessions, draft, ready } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { profile, ready: profileReady } = useProfile();
  const router = useRouter();

  if (!ready || !profileReady) return null;

  const streak = computeStreak(sessions);
  const weekCount = sessionsThisWeek(sessions);
  const volume = totalVolumeThisWeek(sessions);
  const weekDates = currentWeekDates();
  const today = todayStr();
  const sessionDays = new Set(sessions.map((s) => s.date));
  const lastSession = sessions[0];

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-[34px] leading-[1.05] font-black tracking-tight uppercase">
          Давай
          <br />
          за <span style={{ color: "var(--accent)" }}>работу.</span>
        </h1>
        <div className="mt-1 flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
            aria-label="Переключить тему"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden"
            aria-label="Профиль"
          >
            {profile.name ? (
              <span className="text-sm font-black">{profile.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={18} />
            )}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Серия" value={streak} unit="дней" highlight />
        <StatCard label="На этой неделе" value={weekCount} unit={`/${WEEKLY_GOAL} трен.`} />
        <StatCard label="Объём" value={formatVolume(volume).value} unit={formatVolume(volume).unit} />
      </div>

      <div className="rounded-3xl p-5 mb-5" style={{ background: "var(--accent)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-black/60">
            {draft ? "Тренировка в процессе" : "Сегодня"}
          </span>
        </div>
        <p className="text-2xl font-black text-black mb-4">
          {draft ? draft.title : "Нет плана — начни тренировку"}
        </p>
        <button
          onClick={() => {
            router.push("/workout");
          }}
          className="w-full h-12 rounded-2xl bg-black text-white font-bold flex items-center justify-center gap-2"
        >
          {draft ? "Продолжить" : "Начать тренировку"} <ArrowRight size={18} />
        </button>
      </div>

      <div className="rounded-3xl bg-surface border border-border p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Прогресс недели</span>
          <span className="text-[11px] font-bold text-muted">{weekCount} из 7</span>
        </div>
        <div className="flex justify-between">
          {weekDates.map((d, i) => {
            const done = sessionDays.has(d);
            const isToday = d === today;
            return (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: done ? "var(--accent)" : "var(--surface-2)",
                    color: done ? "var(--accent-foreground)" : "var(--muted)",
                    outline: isToday ? "2px solid var(--foreground)" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {done ? "✓" : ""}
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: isToday ? "var(--foreground)" : "var(--muted)" }}
                >
                  {WEEKDAY_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Последняя тренировка</span>
      </div>
      {lastSession ? (
        <Link
          href="/history"
          className="rounded-3xl bg-surface border border-border p-4 flex items-center gap-3"
        >
          <div className="w-1 self-stretch rounded-full" style={{ background: "var(--accent)" }} />
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{lastSession.title}</p>
            <p className="text-xs text-muted mt-0.5">
              {lastSession.date} · {lastSession.exercises.length} упражнений
            </p>
          </div>
          <ChevronRight size={18} color="var(--muted)" />
        </Link>
      ) : (
        <div className="rounded-3xl bg-surface border border-border p-4 text-sm text-muted">
          Пока нет завершённых тренировок
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string | number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-surface border border-border p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color: highlight ? "var(--accent)" : "var(--foreground)" }}>
        {value}
      </p>
      <p className="text-[10px] font-semibold text-muted mt-1">{unit}</p>
    </div>
  );
}
