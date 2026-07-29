"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, Check, Info, Plus, Sparkles, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { EXERCISES, MUSCLE_GROUP_LABELS, type Exercise, type MuscleGroup } from "@/lib/exercises";
import type { ProgramExercise } from "@/lib/types";
import ExercisePicker from "@/components/ExercisePicker";
import ExerciseDetailSheet from "@/components/ExerciseDetailSheet";
import Stepper from "@/components/Stepper";
import {
  GOAL_LABELS,
  LOCATION_LABELS,
  generatePrograms,
  type Goal,
  type Location,
} from "@/lib/programGenerator";

const GOALS = Object.keys(GOAL_LABELS) as Goal[];
const LOCATIONS = Object.keys(LOCATION_LABELS) as Location[];
const DAY_OPTIONS = [1, 2, 3, 4, 5, 6];

interface DraftProgram {
  key: string;
  name: string;
  color: string;
  exercises: ProgramExercise[];
  included: boolean;
}

export default function GenerateProgramPage() {
  const router = useRouter();
  const { saveProgram, customExercises } = useStore();
  const [step, setStep] = useState<"survey" | "review">("survey");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<DraftProgram[]>([]);
  const [pickerForKey, setPickerForKey] = useState<string | null>(null);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  const canGenerate = goal !== null && location !== null && days !== null;

  const handleReview = () => {
    if (!goal || !location || !days) return;
    const generated = generatePrograms(goal, location, days);
    setDrafts(generated.map((g, i) => ({ key: `d${i}`, ...g, included: true })));
    setStep("review");
  };

  const includedCount = drafts.filter((d) => d.included && d.exercises.length > 0).length;

  const handleConfirm = async () => {
    if (includedCount === 0 || saving) return;
    setSaving(true);
    try {
      for (const draft of drafts) {
        if (!draft.included || draft.exercises.length === 0) continue;
        await saveProgram({ name: draft.name.trim() || "Программа", color: draft.color, exercises: draft.exercises });
      }
      router.push("/programs");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (key: string, patch: Partial<DraftProgram>) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  const updateDraftExercise = (key: string, exerciseId: string, patch: Partial<ProgramExercise>) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.key === key
          ? { ...d, exercises: d.exercises.map((e) => (e.exerciseId === exerciseId ? { ...e, ...patch } : e)) }
          : d
      )
    );
  };

  const removeDraftExercise = (key: string, exerciseId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, exercises: d.exercises.filter((e) => e.exerciseId !== exerciseId) } : d))
    );
  };

  const allKnownExercises = useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);
  const findExercise = (pe: ProgramExercise): Exercise =>
    allKnownExercises.find((e) => e.id === pe.exerciseId) ?? {
      id: pe.exerciseId,
      name: pe.name,
      category: pe.category as Exercise["category"],
      equipment: "BODYWEIGHT",
    };

  if (step === "review") {
    const pickerDraft = drafts.find((d) => d.key === pickerForKey) ?? null;
    return (
      <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setStep("survey")}
            className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-2xl font-black">Проверь программы</h1>
        </div>

        <p className="text-sm text-muted mb-5">
          Отметь, какие программы оставить, при желании добавь ещё упражнений или убери лишние — и подтверди, когда
          всё устроит.
        </p>

        <div className="flex flex-col gap-4 mb-4">
          {drafts.map((draft) => (
            <div
              key={draft.key}
              className="rounded-3xl bg-surface border border-border p-4"
              style={{ opacity: draft.included ? 1 : 0.5 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => updateDraft(draft.key, { included: !draft.included })}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: draft.included ? "var(--accent)" : "var(--surface-2)" }}
                  aria-label="Включить программу"
                >
                  {draft.included && <Check size={13} color="var(--accent-foreground)" />}
                </button>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: draft.color }} />
                <input
                  value={draft.name}
                  onChange={(e) => updateDraft(draft.key, { name: e.target.value })}
                  className="flex-1 min-w-0 h-9 rounded-xl bg-surface-2 px-3 text-sm font-bold outline-none"
                />
                <span className="text-[11px] font-bold text-muted shrink-0">{draft.exercises.length}</span>
              </div>

              <div className="flex flex-col gap-2 mb-3">
                {draft.exercises.map((ex) => (
                  <div key={ex.exerciseId} className="rounded-2xl bg-surface-2 p-3">
                    <div className="flex items-center justify-between mb-2.5 gap-2">
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
                      <button
                        onClick={() => removeDraftExercise(draft.key, ex.exerciseId)}
                        className="p-1.5 text-muted shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <Stepper
                        label="Подходы"
                        value={ex.sets}
                        onChange={(v) => updateDraftExercise(draft.key, ex.exerciseId, { sets: v })}
                        min={1}
                      />
                      <Stepper
                        label="Повторения"
                        value={ex.reps}
                        onChange={(v) => updateDraftExercise(draft.key, ex.exerciseId, { reps: v })}
                        min={1}
                      />
                    </div>
                  </div>
                ))}
                {draft.exercises.length === 0 && (
                  <p className="text-xs text-muted text-center py-3">Нет упражнений — программа не будет добавлена</p>
                )}
              </div>

              <button
                onClick={() => setPickerForKey(draft.key)}
                className="w-full h-10 rounded-xl border-2 border-dashed border-border font-bold text-xs text-muted flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Добавить упражнение
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={includedCount === 0 || saving}
          className="w-full h-14 rounded-2xl font-black text-lg disabled:opacity-40"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {saving ? "Добавляем…" : `Добавить программы (${includedCount})`}
        </button>

        {pickerDraft && (
          <ExercisePicker
            excludeIds={new Set(pickerDraft.exercises.map((e) => e.exerciseId))}
            onSelect={(ex) =>
              setDrafts((prev) =>
                prev.map((d) =>
                  d.key === pickerDraft.key
                    ? { ...d, exercises: [...d.exercises, { exerciseId: ex.id, name: ex.name, category: ex.category, sets: 3, reps: 10 }] }
                    : d
                )
              )
            }
            onClose={() => setPickerForKey(null)}
          />
        )}

        {detailExercise && (
          <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/programs")}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-black">Подбор программы</h1>
      </div>

      <p className="text-sm text-muted mb-5">
        Ответь на пару вопросов — подберём программу тренировок (или несколько, по одной на тренировочный день) и
        покажем перед добавлением, чтобы можно было её поправить.
      </p>

      <Section title="Цель">
        <div className="flex flex-col gap-2">
          {GOALS.map((g) => (
            <OptionButton key={g} active={goal === g} onClick={() => setGoal(g)} label={GOAL_LABELS[g]} />
          ))}
        </div>
      </Section>

      <Section title="Где занимаешься">
        <div className="flex flex-col gap-2">
          {LOCATIONS.map((l) => (
            <OptionButton key={l} active={location === l} onClick={() => setLocation(l)} label={LOCATION_LABELS[l]} />
          ))}
        </div>
      </Section>

      <Section title="Сколько дней в неделю">
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="w-12 h-12 rounded-2xl font-bold text-sm"
              style={{
                background: days === d ? "var(--accent)" : "var(--surface-2)",
                color: days === d ? "var(--accent-foreground)" : "var(--muted)",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </Section>

      <button
        onClick={handleReview}
        disabled={!canGenerate}
        className="w-full h-14 rounded-2xl font-black text-lg disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        <Sparkles size={18} />
        Подобрать программу
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">{title}</p>
      {children}
    </div>
  );
}

function OptionButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-12 rounded-2xl px-4 text-left font-bold text-sm"
      style={{
        background: active ? "var(--accent)" : "var(--surface-2)",
        color: active ? "var(--accent-foreground)" : "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}
