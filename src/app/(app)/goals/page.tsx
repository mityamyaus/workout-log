"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronLeft, Plus, Target, Trash2, TrendingUp, Trophy, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Exercise } from "@/lib/exercises";
import type { GoalTargetType } from "@/lib/types";
import { computeGoalProgress, currentBestValue, suggestNextTarget, type GoalProgress } from "@/lib/goals";
import { todayStr } from "@/lib/stats";
import ExercisePicker from "@/components/ExercisePicker";

function formatValue(value: number, type: GoalTargetType) {
  return type === "WEIGHT" ? `${round1(value)} кг` : `${round1(value / 1000)} т`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export default function GoalsPage() {
  const router = useRouter();
  const { sessions, goals, ready, addGoal, archiveGoal, deleteGoal } = useStore();
  const [creating, setCreating] = useState(false);

  const progresses = useMemo(
    () =>
      goals
        .filter((g) => !g.archived)
        .map((g) => computeGoalProgress(g, sessions))
        .sort((a, b) => b.goal.createdAt - a.goal.createdAt),
    [goals, sessions]
  );

  const active = progresses.filter((p) => p.status === "ACTIVE");
  const achieved = progresses.filter((p) => p.status === "ACHIEVED");
  const failed = progresses.filter((p) => p.status === "FAILED");

  if (!ready) return null;

  const handleBump = async (progress: GoalProgress) => {
    const nextTarget = suggestNextTarget(progress);
    await archiveGoal(progress.goal.id, true);
    await addGoal({
      exerciseId: progress.goal.exerciseId,
      exerciseName: progress.goal.exerciseName,
      targetType: progress.goal.targetType,
      targetValue: nextTarget,
      targetReps: progress.goal.targetReps,
      startValue: progress.goal.targetValue,
      startDate: progress.achievedDate ?? todayStr(),
      deadline: null,
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/")}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-black">Цели</h1>
      </div>

      <button
        onClick={() => setCreating(true)}
        className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-5"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        <Plus size={16} /> Новая цель
      </button>

      {progresses.length === 0 && (
        <p className="text-sm text-muted text-center py-8">
          Пока нет целей. Поставь первую — например, дожать жим лёжа до определённого веса.
        </p>
      )}

      {achieved.length > 0 && (
        <Section title={`Достигнуто · ${achieved.length}`}>
          {achieved.map((p) => (
            <GoalCard key={p.goal.id} progress={p} onBump={() => handleBump(p)} onArchive={() => archiveGoal(p.goal.id, true)} onDelete={() => deleteGoal(p.goal.id)} />
          ))}
        </Section>
      )}

      {active.length > 0 && (
        <Section title={`Активные · ${active.length}`}>
          {active.map((p) => (
            <GoalCard key={p.goal.id} progress={p} onDelete={() => deleteGoal(p.goal.id)} />
          ))}
        </Section>
      )}

      {failed.length > 0 && (
        <Section title={`Не успели · ${failed.length}`}>
          {failed.map((p) => (
            <GoalCard key={p.goal.id} progress={p} onDelete={() => deleteGoal(p.goal.id)} />
          ))}
        </Section>
      )}

      {creating && (
        <CreateGoalSheet
          sessions={sessions}
          onClose={() => setCreating(false)}
          onCreate={async (goal) => {
            await addGoal(goal);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function GoalCard({
  progress,
  onBump,
  onArchive,
  onDelete,
}: {
  progress: GoalProgress;
  onBump?: () => void;
  onArchive?: () => void;
  onDelete: () => void;
}) {
  const { goal, currentValue, progressPct, status, achievedDate, forecastDate, aheadOfSchedule } = progress;

  return (
    <div
      className="rounded-3xl p-4"
      style={{
        background: status === "ACHIEVED" ? "#233a2a" : "var(--surface)",
        border: status === "FAILED" ? "1px dashed var(--border)" : "1px solid var(--border)",
        opacity: status === "FAILED" ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{goal.exerciseName}</p>
          <p className="text-[11px] text-muted font-semibold">
            {goal.targetType === "WEIGHT" && goal.targetReps ? `на ${goal.targetReps} повторов` : "лучший подход"}
            {goal.deadline && ` · до ${formatDate(goal.deadline)}`}
          </p>
        </div>
        {status === "ACHIEVED" ? (
          <Trophy size={18} color="#ffd93d" className="shrink-0" />
        ) : (
          <button onClick={onDelete} className="p-1 text-muted shrink-0" aria-label="Удалить цель">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-lg font-black">{formatValue(currentValue, goal.targetType)}</span>
        <span className="text-xs text-muted font-semibold">цель {formatValue(goal.targetValue, goal.targetType)}</span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden mb-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progressPct}%`,
            background: status === "ACHIEVED" ? "#5dcaa5" : status === "FAILED" ? "var(--muted)" : "var(--accent)",
          }}
        />
      </div>

      {status === "ACHIEVED" && (
        <p className="text-[11px] font-semibold mb-3" style={{ color: "#5dcaa5" }}>
          Цель достигнута{achievedDate ? ` ${formatDate(achievedDate)}` : ""} 🎉
        </p>
      )}
      {status === "ACTIVE" && forecastDate && (
        <p className="text-[11px] text-muted font-semibold mb-1 flex items-center gap-1">
          <TrendingUp size={12} />
          при текущем темпе — к {formatDate(forecastDate)}
          {aheadOfSchedule !== null && (
            <span style={{ color: aheadOfSchedule ? "#5dcaa5" : "#ff6fae" }}>
              {aheadOfSchedule ? " (раньше срока)" : " (позже дедлайна)"}
            </span>
          )}
        </p>
      )}
      {status === "FAILED" && <p className="text-[11px] text-muted font-semibold mb-1">Дедлайн прошёл</p>}

      {status === "ACHIEVED" && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onBump}
            className="flex-1 h-9 rounded-xl text-xs font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            Поднять планку
          </button>
          <button onClick={onArchive} className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center" aria-label="Убрать из списка">
            <Archive size={14} color="var(--muted)" />
          </button>
        </div>
      )}
    </div>
  );
}

function CreateGoalSheet({
  sessions,
  onClose,
  onCreate,
}: {
  sessions: import("@/lib/types").WorkoutSession[];
  onClose: () => void;
  onCreate: (goal: {
    exerciseId: string;
    exerciseName: string;
    targetType: GoalTargetType;
    targetValue: number;
    targetReps: number | null;
    startValue: number;
    startDate: string;
    deadline: string | null;
  }) => Promise<void>;
}) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [pickerOpen, setPickerOpen] = useState(exercise === null);
  const [targetType, setTargetType] = useState<GoalTargetType>("WEIGHT");
  const [targetValue, setTargetValue] = useState("");
  const [targetReps, setTargetReps] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  // ExercisePicker fires onSelect then onClose synchronously in the same
  // click handler, before this component re-renders — reading `exercise`
  // state inside onClose would see the pre-selection (stale) value, so track
  // "just picked one" with a ref instead of relying on state in that closure.
  const justSelected = useRef(false);

  if (pickerOpen) {
    return (
      <ExercisePicker
        title="Для какого упражнения?"
        excludeIds={new Set()}
        onSelect={(ex) => {
          justSelected.current = true;
          setExercise(ex);
          setPickerOpen(false);
        }}
        onClose={() => {
          if (justSelected.current) {
            justSelected.current = false;
            return;
          }
          onClose();
        }}
      />
    );
  }
  if (!exercise) return null;

  const startValue = currentBestValue(
    sessions,
    exercise.id,
    targetType,
    targetReps ? Number(targetReps) : null
  );
  const canSave = Number(targetValue) > startValue && !saving;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-w-md w-full mx-auto rounded-t-[28px] bg-background p-5 pb-[calc(24px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-black">{exercise.name}</h2>
            <p className="text-xs text-muted mt-0.5">Сейчас: {formatValue(startValue, targetType)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
            <X size={18} />
          </button>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Что растим</p>
        <div className="flex gap-1.5 mb-4">
          <button
            onClick={() => setTargetType("WEIGHT")}
            className="flex-1 h-10 rounded-xl text-xs font-bold"
            style={{
              background: targetType === "WEIGHT" ? "var(--accent)" : "var(--surface-2)",
              color: targetType === "WEIGHT" ? "var(--accent-foreground)" : "var(--muted)",
            }}
          >
            Вес в подходе
          </button>
          <button
            onClick={() => setTargetType("VOLUME")}
            className="flex-1 h-10 rounded-xl text-xs font-bold"
            style={{
              background: targetType === "VOLUME" ? "var(--accent)" : "var(--surface-2)",
              color: targetType === "VOLUME" ? "var(--accent-foreground)" : "var(--muted)",
            }}
          >
            Объём за тренировку
          </button>
        </div>

        {targetType === "WEIGHT" && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">На сколько повторов (необязательно)</p>
            <input
              type="number"
              inputMode="numeric"
              value={targetReps}
              onChange={(e) => setTargetReps(e.target.value)}
              placeholder="Любое количество"
              className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none mb-4"
            />
          </>
        )}

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">
          Целевое значение, {targetType === "WEIGHT" ? "кг" : "кг (объём за тренировку)"}
        </p>
        <input
          type="number"
          inputMode="decimal"
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
          placeholder={targetType === "WEIGHT" ? "например 100" : "например 3000"}
          className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none mb-4"
        />

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Дедлайн (необязательно)</p>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none mb-5"
        />

        <button
          onClick={async () => {
            if (!canSave) return;
            setSaving(true);
            try {
              await onCreate({
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                targetType,
                targetValue: Number(targetValue),
                targetReps: targetReps ? Number(targetReps) : null,
                startValue,
                startDate: todayStr(),
                deadline: deadline || null,
              });
            } finally {
              setSaving(false);
            }
          }}
          disabled={!canSave}
          className="w-full h-12 rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <Target size={16} />
          {saving ? "Создаём…" : "Создать цель"}
        </button>
      </div>
    </div>
  );
}
