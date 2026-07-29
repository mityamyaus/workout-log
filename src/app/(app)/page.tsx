"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sun, Moon, ArrowRight, ChevronRight, User, CalendarPlus, CheckCircle2, Users, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { DEFAULT_PROGRAM_COLOR } from "@/lib/colors";
import { getTodaysPhrase } from "@/lib/motivationalPhrases";
import { findRecentPR } from "@/lib/achievements";
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

function formatPlanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAY_LABELS[(date.getDay() + 6) % 7];
  return `${weekday}, ${d}.${String(m).padStart(2, "0")}`;
}

export default function TodayPage() {
  const { sessions, plans, draft, ready, startDraft, startProgram, removePlan } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [incomingCount, setIncomingCount] = useState(0);

  useEffect(() => {
    api
      .get<{ incoming: unknown[] }>("/api/friends")
      .then((data) => setIncomingCount(data.incoming.length))
      .catch(() => {});
  }, []);

  const recentPR = useMemo(() => findRecentPR(sessions), [sessions]);

  if (!ready || !user) return null;

  const streak = computeStreak(sessions);
  const weekCount = sessionsThisWeek(sessions);
  const volume = totalVolumeThisWeek(sessions);
  const weekDates = currentWeekDates();
  const today = todayStr();
  const sessionDays = new Set(sessions.map((s) => s.date));
  const lastSession = sessions[0];
  const todaysPlan = plans.find((p) => p.date === today);
  const completedToday = sessionDays.has(today);
  const phrase = getTodaysPhrase();
  const upcomingPlan = plans
    .filter((p) => p.date > today)
    .sort((a, b) => (a.date === b.date ? (a.time || "").localeCompare(b.time || "") : a.date.localeCompare(b.date)))[0];

  const handleStart = () => {
    if (draft) {
      router.push("/workout");
      return;
    }
    if (todaysPlan) {
      if (todaysPlan.programId) startProgram(todaysPlan.programId);
      else startDraft({ title: todaysPlan.title, color: todaysPlan.color });
      removePlan(todaysPlan.id);
      router.push("/workout");
      return;
    }
    router.push("/calendar");
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-[34px] leading-[1.05] font-black tracking-tight uppercase">
          {phrase.line1}
          <br />
          {phrase.line2Prefix}
          <span style={{ color: "var(--accent)" }}>{phrase.line2Accent}</span>
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
            href="/friends"
            className="relative w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
            aria-label="Друзья"
          >
            <Users size={18} />
            {incomingCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: "#ff6fae", borderColor: "var(--background)" }}
              />
            )}
          </Link>
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden"
            aria-label="Профиль"
          >
            {user.name ? (
              <span className="text-sm font-black">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={18} />
            )}
          </Link>
        </div>
      </div>

      {recentPR && (
        <Link
          href="/achievements"
          className="flex items-center gap-2.5 rounded-3xl bg-surface border border-border p-3.5 mb-5"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#3a3320" }}>
            <Trophy size={16} color="#ffd93d" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">Новый личный рекорд</p>
            <p className="text-[11px] text-muted truncate">
              {recentPR.exerciseName} — {recentPR.weight} кг × {recentPR.reps}
            </p>
          </div>
          <ChevronRight size={16} color="var(--muted)" />
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Серия" value={streak} unit="дней" highlight />
        <StatCard label="На этой неделе" value={weekCount} unit={`/${WEEKLY_GOAL} трен.`} />
        <StatCard label="Объём" value={formatVolume(volume).value} unit={formatVolume(volume).unit} />
      </div>

      <div className="rounded-3xl p-5 mb-5" style={{ background: "var(--accent)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-black/60">
            {draft
              ? "Тренировка в процессе"
              : todaysPlan
              ? todaysPlan.time
                ? `Запланировано на ${todaysPlan.time}`
                : "Запланировано на сегодня"
              : !completedToday && upcomingPlan
              ? "Ближайшая тренировка"
              : "Сегодня"}
          </span>
        </div>
        <p className="text-2xl font-black text-black mb-4 flex items-center gap-2">
          {(draft || todaysPlan || (!completedToday && upcomingPlan)) && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: draft ? draft.color : todaysPlan ? todaysPlan.color : upcomingPlan!.color }}
            />
          )}
          {draft
            ? draft.title
            : todaysPlan
            ? todaysPlan.title
            : completedToday
            ? "Тренировка на сегодня пройдена"
            : upcomingPlan
            ? `${upcomingPlan.title} — ${formatPlanDate(upcomingPlan.date)}${upcomingPlan.time ? `, ${upcomingPlan.time}` : ""}`
            : "На сегодня ничего не запланировано"}
        </p>
        {completedToday && !draft && !todaysPlan ? (
          <Link
            href="/history"
            className="w-full h-12 rounded-2xl bg-black text-white font-bold flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} /> Смотреть в истории
          </Link>
        ) : (
          <button
            onClick={handleStart}
            className="w-full h-12 rounded-2xl bg-black text-white font-bold flex items-center justify-center gap-2"
          >
            {draft ? (
              <>
                Продолжить <ArrowRight size={18} />
              </>
            ) : todaysPlan ? (
              <>
                Начать тренировку <ArrowRight size={18} />
              </>
            ) : upcomingPlan ? (
              <>
                Открыть календарь <ArrowRight size={18} />
              </>
            ) : (
              <>
                Запланировать в календаре <CalendarPlus size={18} />
              </>
            )}
          </button>
        )}
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
          <div className="w-1 self-stretch rounded-full" style={{ background: lastSession.color || DEFAULT_PROGRAM_COLOR }} />
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
