"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { sessionVolume } from "@/lib/stats";
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/lib/exercises";
import { DEFAULT_PROGRAM_COLOR } from "@/lib/colors";

export default function HistoryPage() {
  const { sessions, ready, deleteSession } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-black mb-4">История</h1>

      {sessions.length === 0 && (
        <div className="rounded-3xl bg-surface border border-border p-6 text-center text-sm text-muted">
          Пока нет завершённых тренировок
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sessions.map((s) => {
          const open = openId === s.id;
          const duration = s.finishedAt ? Math.round((s.finishedAt - s.startedAt) / 60000) : null;
          return (
            <div key={s.id} className="rounded-3xl bg-surface border border-border overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : s.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color || DEFAULT_PROGRAM_COLOR }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{s.title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {s.date} {duration !== null ? `· ${duration} мин` : ""} · {s.exercises.length} упр.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="font-black" style={{ color: "var(--accent)" }}>
                    {sessionVolume(s).toFixed(0)} кг
                  </p>
                  <ChevronDown
                    size={18}
                    color="var(--muted)"
                    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                  />
                </div>
              </button>

              {open && (
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-border pt-3">
                  {s.exercises.map((ex) => (
                    <div key={ex.exerciseId}>
                      <p className="text-sm font-bold">{ex.name}</p>
                      <p className="text-[10px] font-semibold text-muted uppercase mb-1.5">
                        {MUSCLE_GROUP_LABELS[ex.category as MuscleGroup] ?? ex.category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ex.sets.map((set, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{
                              background: set.completed ? "var(--surface-2)" : "transparent",
                              color: set.completed ? "var(--foreground)" : "var(--muted)",
                              border: set.completed ? "none" : "1px dashed var(--border)",
                            }}
                          >
                            {set.weight}кг × {set.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      if (confirm("Удалить тренировку?")) deleteSession(s.id);
                    }}
                    className="self-start flex items-center gap-1.5 text-xs font-bold text-danger mt-1"
                  >
                    <Trash2 size={14} /> Удалить
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
