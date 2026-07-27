"use client";

import { useMemo } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { useProfile } from "@/lib/profile";
import {
  computeStreak,
  muscleGroupTotals,
  sessionVolume,
  weeklyVolumeSeries,
} from "@/lib/stats";
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/lib/exercises";

export default function StatsPage() {
  const { sessions, ready } = useStore();
  const { profile, ready: profileReady } = useProfile();

  const streak = ready ? computeStreak(sessions) : 0;
  const totalSessions = sessions.length;
  const totalVolume = useMemo(() => sessions.reduce((sum, s) => sum + sessionVolume(s), 0), [sessions]);
  const series = useMemo(() => weeklyVolumeSeries(sessions, 8), [sessions]);
  const groupTotals = useMemo(() => muscleGroupTotals(sessions), [sessions]);
  const topGroups = useMemo(
    () => Object.entries(groupTotals).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [groupTotals]
  );
  const maxSets = topGroups[0]?.[1] ?? 1;
  const weightSeries = useMemo(
    () => profile.weightLog.slice(-12).map((e) => ({ label: e.date.slice(5), weight: e.weight })),
    [profile.weightLog]
  );

  if (!ready || !profileReady) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-black mb-4">Статистика</h1>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat label="Серия" value={streak} unit="дн." />
        <MiniStat label="Тренировок" value={totalSessions} unit="всего" />
        <MiniStat label="Общий объём" value={(totalVolume / 1000).toFixed(1)} unit="т" />
      </div>

      <div className="rounded-3xl bg-surface border border-border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Вес, кг</p>
          {profile.weight && (
            <p className="text-lg font-black" style={{ color: "var(--accent)" }}>
              {profile.weight} кг
            </p>
          )}
        </div>
        {weightSeries.length > 1 ? (
          <div style={{ width: "100%", height: 140 }}>
            <ResponsiveContainer>
              <LineChart data={weightSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Добавь вес в{" "}
            <a href="/profile" className="font-bold underline">
              профиле
            </a>
            , чтобы видеть график
          </p>
        )}
      </div>

      <div className="rounded-3xl bg-surface border border-border p-4 mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-3">Объём по неделям, кг</p>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={series} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-2)" }}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="volume" radius={[6, 6, 6, 6]} fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-surface border border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-3">
          Топ групп мышц по подходам
        </p>
        {topGroups.length === 0 && <p className="text-sm text-muted">Пока нет данных</p>}
        <div className="flex flex-col gap-3">
          {topGroups.map(([group, count]) => (
            <div key={group}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{MUSCLE_GROUP_LABELS[group as MuscleGroup] ?? group}</span>
                <span className="text-xs font-bold text-muted">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(count / maxSets) * 100}%`, background: "var(--accent)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="rounded-3xl bg-surface border border-border p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">{label}</p>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-[10px] font-semibold text-muted mt-1">{unit}</p>
    </div>
  );
}
