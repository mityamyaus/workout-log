"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, Info, Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { PROGRAM_COLORS, DEFAULT_PROGRAM_COLOR } from "@/lib/colors";
import { EXERCISES, MUSCLE_GROUP_LABELS, type Exercise, type MuscleGroup } from "@/lib/exercises";
import type { Program, ProgramExercise } from "@/lib/types";
import ExercisePicker from "@/components/ExercisePicker";
import ExerciseDetailSheet from "@/components/ExerciseDetailSheet";

export default function ProgramBuilder({ existing }: { existing?: Program }) {
  const router = useRouter();
  const { saveProgram, deleteProgram, customExercises } = useStore();
  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.color ?? DEFAULT_PROGRAM_COLOR);
  const [exercises, setExercises] = useState<ProgramExercise[]>(existing?.exercises ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  const excludeIds = useMemo(() => new Set(exercises.map((e) => e.exerciseId)), [exercises]);

  const allKnownExercises = useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);
  const findExercise = (pe: ProgramExercise): Exercise =>
    allKnownExercises.find((e) => e.id === pe.exerciseId) ?? {
      id: pe.exerciseId,
      name: pe.name,
      category: pe.category as Exercise["category"],
      equipment: "BODYWEIGHT",
    };

  const updateExercise = (exerciseId: string, patch: Partial<ProgramExercise>) => {
    setExercises((prev) => prev.map((e) => (e.exerciseId === exerciseId ? { ...e, ...patch } : e)));
  };

  const removeExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const [saving, setSaving] = useState(false);
  const canSave = name.trim().length > 0 && exercises.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveProgram({ id: existing?.id, name: name.trim(), color, exercises });
      router.push("/programs");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (confirm("Удалить программу?")) {
      await deleteProgram(existing.id);
      router.push("/programs");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/programs")}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-black">{existing ? "Изменить программу" : "Новая программа"}</h1>
      </div>

      <div className="rounded-3xl bg-surface border border-border p-4 mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Название</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Push Day A"
          className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none mb-4"
        />
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Цвет</p>
        <div className="flex flex-wrap gap-2">
          {PROGRAM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: c, outline: color === c ? "2.5px solid var(--foreground)" : "none", outlineOffset: 2 }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Упражнения</span>
        <span className="text-[11px] font-bold text-muted">{exercises.length}</span>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {exercises.map((ex) => (
          <div key={ex.exerciseId} className="rounded-3xl bg-surface border border-border p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <button
                onClick={() => setDetailExercise(findExercise(ex))}
                className="min-w-0 text-left flex items-center gap-1.5"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{ex.name}</p>
                  <p className="text-[11px] text-muted font-semibold uppercase tracking-wide">
                    {MUSCLE_GROUP_LABELS[ex.category as MuscleGroup] ?? ex.category}
                  </p>
                </div>
                <Info size={13} color="var(--muted)" className="shrink-0" />
              </button>
              <button onClick={() => removeExercise(ex.exerciseId)} className="p-1.5 text-muted shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Stepper
                label="Подходы"
                value={ex.sets}
                onChange={(v) => updateExercise(ex.exerciseId, { sets: v })}
                min={1}
              />
              <Stepper
                label="Повторения"
                value={ex.reps}
                onChange={(v) => updateExercise(ex.exerciseId, { reps: v })}
                min={1}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full h-12 rounded-2xl border-2 border-dashed border-border font-bold text-sm text-muted flex items-center justify-center gap-2 mb-4"
      >
        <Plus size={16} /> Добавить упражнение
      </button>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full h-14 rounded-2xl font-black text-lg disabled:opacity-40 mb-3"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        {saving ? "Сохраняем…" : "Сохранить программу"}
      </button>

      {existing && (
        <button onClick={handleDelete} className="w-full h-11 rounded-2xl font-bold text-sm text-danger">
          Удалить программу
        </button>
      )}

      {pickerOpen && (
        <ExercisePicker
          excludeIds={excludeIds}
          onSelect={(ex) =>
            setExercises((prev) => [
              ...prev,
              { exerciseId: ex.id, name: ex.name, category: ex.category, sets: 3, reps: 10 },
            ])
          }
          onClose={() => setPickerOpen(false)}
        />
      )}

      {detailExercise && (
        <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} />
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center font-bold text-sm">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
