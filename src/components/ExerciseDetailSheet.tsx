"use client";

import { X } from "lucide-react";
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS, type Exercise, type MuscleGroup, type Equipment } from "@/lib/exercises";

export default function ExerciseDetailSheet({
  exercise,
  added,
  onClose,
  onAdd,
}: {
  exercise: Exercise;
  added?: boolean;
  onClose: () => void;
  onAdd?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-w-md w-full mx-auto rounded-t-[28px] bg-background p-5 pb-[calc(24px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-black pr-3">{exercise.name}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
            <X size={18} />
          </button>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-4">
          {MUSCLE_GROUP_LABELS[exercise.category as MuscleGroup] ?? exercise.category} ·{" "}
          {EQUIPMENT_LABELS[exercise.equipment as Equipment] ?? exercise.equipment}
        </p>

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">Как выполнять</p>
        {exercise.description && exercise.description.length > 0 ? (
          <div className="flex flex-col gap-2.5 mb-5">
            {exercise.description.map((step, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mb-5">Описание для этого упражнения ещё не добавлено.</p>
        )}

        {onAdd && (
          <button
            onClick={onAdd}
            disabled={added}
            className="w-full h-12 rounded-2xl font-bold disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            {added ? "Уже добавлено" : "Добавить упражнение"}
          </button>
        )}
      </div>
    </div>
  );
}
