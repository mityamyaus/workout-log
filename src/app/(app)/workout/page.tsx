"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/lib/exercises";
import ExercisePicker from "@/components/ExercisePicker";

export default function WorkoutPage() {
  const router = useRouter();
  const { draft, ready, discardDraft, finishDraft } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (ready && !draft) router.replace("/programs");
  }, [ready, draft, router]);

  if (!ready || !draft) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: draft.color }} />
          <h1 className="text-2xl font-black truncate">{draft.title}</h1>
        </div>
        <button
          onClick={() => {
            if (confirm("Отменить тренировку? Все данные будут потеряны.")) discardDraft();
          }}
          className="text-xs font-bold text-danger shrink-0 ml-2"
        >
          Отменить
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        {draft.exercises.map((ex) => (
          <ExerciseCard key={ex.exerciseId} exerciseId={ex.exerciseId} name={ex.name} category={ex.category} sets={ex.sets} />
        ))}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full h-12 rounded-2xl border-2 border-dashed border-border font-bold text-sm text-muted flex items-center justify-center gap-2 mb-4"
      >
        <Plus size={16} /> Добавить упражнение
      </button>

      {draft.exercises.length > 0 && (
        <button
          onClick={finishDraft}
          className="w-full h-14 rounded-2xl font-black text-lg"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          Завершить тренировку
        </button>
      )}

      {pickerOpen && (
        <WorkoutExercisePicker exerciseIds={new Set(draft.exercises.map((e) => e.exerciseId))} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

function WorkoutExercisePicker({ exerciseIds, onClose }: { exerciseIds: Set<string>; onClose: () => void }) {
  const { addExerciseToDraft } = useStore();
  return (
    <ExercisePicker
      excludeIds={exerciseIds}
      onSelect={(ex) => addExerciseToDraft(ex.id, ex.name, ex.category)}
      onClose={onClose}
    />
  );
}

function ExerciseCard({
  exerciseId,
  name,
  category,
  sets,
}: {
  exerciseId: string;
  name: string;
  category: string;
  sets: { weight: number; reps: number; completed: boolean }[];
}) {
  const { addSet, updateSet, removeSet, removeExerciseFromDraft } = useStore();

  return (
    <div className="rounded-3xl bg-surface border border-border p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0">
          <p className="font-bold truncate">{name}</p>
          <p className="text-[11px] text-muted font-semibold uppercase tracking-wide">
            {MUSCLE_GROUP_LABELS[category as MuscleGroup] ?? category}
          </p>
        </div>
        <button onClick={() => removeExerciseFromDraft(exerciseId)} className="p-1.5 text-muted shrink-0">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 text-[10px] font-bold text-muted">
        <span className="w-5 text-center shrink-0">#</span>
        <span className="flex-1 text-center">КГ</span>
        <span className="flex-1 text-center">ПОВТ.</span>
        <span className="w-8 shrink-0" />
        <span className="w-8 shrink-0" />
      </div>

      <div className="flex flex-col gap-1.5">
        {sets.map((set, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-5 text-center text-xs font-bold text-muted shrink-0">{i + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              value={set.weight || ""}
              onChange={(e) => updateSet(exerciseId, i, { weight: Number(e.target.value) || 0 })}
              className="flex-1 min-w-0 h-10 rounded-xl bg-surface-2 text-center font-bold text-sm outline-none"
              placeholder="0"
            />
            <input
              type="number"
              inputMode="numeric"
              value={set.reps || ""}
              onChange={(e) => updateSet(exerciseId, i, { reps: Number(e.target.value) || 0 })}
              className="flex-1 min-w-0 h-10 rounded-xl bg-surface-2 text-center font-bold text-sm outline-none"
              placeholder="0"
            />
            <button
              onClick={() => updateSet(exerciseId, i, { completed: !set.completed })}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: set.completed ? "var(--accent)" : "var(--surface-2)" }}
              aria-label="Отметить выполненным"
            >
              <Check size={15} color={set.completed ? "var(--accent-foreground)" : "var(--muted)"} />
            </button>
            <button
              onClick={() => removeSet(exerciseId, i)}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-surface-2"
              aria-label="Удалить подход"
            >
              <Trash2 size={14} color="var(--danger)" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => addSet(exerciseId)}
        className="w-full h-9 rounded-xl bg-surface-2 text-xs font-bold flex items-center justify-center gap-1 mt-3"
      >
        <Plus size={14} /> Подход
      </button>
    </div>
  );
}
