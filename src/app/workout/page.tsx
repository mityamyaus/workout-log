"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Search, Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { EXERCISES, MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS, type MuscleGroup } from "@/lib/exercises";

export default function WorkoutPage() {
  const { draft, ready, startDraft, discardDraft, finishDraft } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!ready) return null;

  if (!draft) {
    return (
      <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={28} color="var(--accent-foreground)" />
        </div>
        <h1 className="text-2xl font-black mb-1">Начать тренировку</h1>
        <p className="text-sm text-muted mb-6 max-w-xs">
          Выбери упражнения, добавляй подходы и фиксируй вес и повторения
        </p>
        <button
          onClick={startDraft}
          className="h-12 px-8 rounded-2xl font-bold"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          Начать
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black">{draft.title}</h1>
        <button
          onClick={() => {
            if (confirm("Отменить тренировку? Все данные будут потеряны.")) discardDraft();
          }}
          className="text-xs font-bold text-danger"
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

      {pickerOpen && <ExercisePicker onClose={() => setPickerOpen(false)} />}
    </div>
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
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold">{name}</p>
          <p className="text-[11px] text-muted font-semibold uppercase tracking-wide">
            {MUSCLE_GROUP_LABELS[category as MuscleGroup] ?? category}
          </p>
        </div>
        <button onClick={() => removeExerciseFromDraft(exerciseId)} className="p-1.5 text-muted">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-[24px_1fr_1fr_32px] gap-2 items-center mb-1.5 px-1">
        <span className="text-[10px] font-bold text-muted">#</span>
        <span className="text-[10px] font-bold text-muted">КГ</span>
        <span className="text-[10px] font-bold text-muted">ПОВТ.</span>
        <span />
      </div>

      <div className="flex flex-col gap-2">
        {sets.map((set, i) => (
          <div key={i} className="grid grid-cols-[24px_1fr_1fr_32px] gap-2 items-center">
            <span className="text-xs font-bold text-muted">{i + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              value={set.weight || ""}
              onChange={(e) => updateSet(exerciseId, i, { weight: Number(e.target.value) || 0 })}
              className="h-10 rounded-xl bg-surface-2 text-center font-bold text-sm outline-none"
              placeholder="0"
            />
            <input
              type="number"
              inputMode="numeric"
              value={set.reps || ""}
              onChange={(e) => updateSet(exerciseId, i, { reps: Number(e.target.value) || 0 })}
              className="h-10 rounded-xl bg-surface-2 text-center font-bold text-sm outline-none"
              placeholder="0"
            />
            <button
              onClick={() => updateSet(exerciseId, i, { completed: !set.completed })}
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
              style={{
                background: set.completed ? "var(--accent)" : "var(--surface-2)",
              }}
            >
              <Check size={16} color={set.completed ? "var(--accent-foreground)" : "var(--muted)"} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => addSet(exerciseId)}
          className="flex-1 h-9 rounded-xl bg-surface-2 text-xs font-bold flex items-center justify-center gap-1"
        >
          <Plus size={14} /> Подход
        </button>
        {sets.length > 1 && (
          <button
            onClick={() => removeSet(exerciseId, sets.length - 1)}
            className="w-9 h-9 rounded-xl bg-surface-2 text-xs font-bold flex items-center justify-center"
          >
            <Minus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ExercisePicker({ onClose }: { onClose: () => void }) {
  const { addExerciseToDraft, draft } = useStore();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "ALL">("ALL");

  const addedIds = useMemo(() => new Set(draft?.exercises.map((e) => e.exerciseId)), [draft]);

  const groups = useMemo(() => {
    const set = new Set<MuscleGroup>();
    EXERCISES.forEach((e) => set.add(e.category));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    return EXERCISES.filter((e) => {
      if (group !== "ALL" && e.category !== group) return false;
      if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, group]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="max-w-md w-full mx-auto flex flex-col h-full">
        <div className="flex items-center justify-between px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-3">
          <h2 className="text-xl font-black">Упражнения</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 mb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск упражнения"
              className="w-full h-11 rounded-2xl bg-surface-2 pl-10 pr-4 text-sm font-medium outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          <Chip active={group === "ALL"} onClick={() => setGroup("ALL")} label="Все" />
          {groups.map((g) => (
            <Chip key={g} active={group === g} onClick={() => setGroup(g)} label={MUSCLE_GROUP_LABELS[g]} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-2">
            {filtered.map((ex) => {
              const added = addedIds.has(ex.id);
              return (
                <button
                  key={ex.id}
                  disabled={added}
                  onClick={() => {
                    addExerciseToDraft(ex.id, ex.name, ex.category);
                    onClose();
                  }}
                  className="rounded-2xl bg-surface border border-border p-3.5 flex items-center justify-between text-left disabled:opacity-40"
                >
                  <div>
                    <p className="font-bold text-sm">{ex.name}</p>
                    <p className="text-[11px] text-muted font-semibold">
                      {MUSCLE_GROUP_LABELS[ex.category]} · {EQUIPMENT_LABELS[ex.equipment]}
                    </p>
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: added ? "var(--surface-2)" : "var(--accent)" }}
                  >
                    {added ? <Check size={14} /> : <Plus size={14} color="var(--accent-foreground)" />}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted text-center py-8">Ничего не найдено</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 h-8 px-3.5 rounded-full text-xs font-bold whitespace-nowrap"
      style={{
        background: active ? "var(--accent)" : "var(--surface-2)",
        color: active ? "var(--accent-foreground)" : "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}
