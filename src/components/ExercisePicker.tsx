"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Check, Plus, Search, X, Info } from "lucide-react";
import {
  EXERCISES,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  BODY_PART_LABELS,
  MUSCLE_TO_BODY_PART,
  type Exercise,
  type MuscleGroup,
  type Equipment,
} from "@/lib/exercises";
import { useStore } from "@/lib/store";
import ExerciseDetailSheet from "@/components/ExerciseDetailSheet";

type GroupBy = "muscle" | "bodyPart" | "equipment";

export default function ExercisePicker({
  title = "Упражнения",
  excludeIds,
  onSelect,
  onClose,
}: {
  title?: string;
  excludeIds: Set<string>;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const { customExercises } = useStore();
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("bodyPart");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  const customIds = useMemo(() => new Set(customExercises.map((e) => e.id)), [customExercises]);
  const allExercises = useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);

  const filtered = useMemo(() => {
    if (!query) return allExercises;
    const q = query.toLowerCase();
    return allExercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, allExercises]);

  const groupKeyOf = (ex: Exercise) =>
    groupBy === "muscle" ? ex.category : groupBy === "bodyPart" ? MUSCLE_TO_BODY_PART[ex.category] : ex.equipment;

  const secondaryLabelOf = (ex: Exercise) =>
    groupBy === "equipment" ? MUSCLE_GROUP_LABELS[ex.category] : EQUIPMENT_LABELS[ex.equipment];

  const groups = useMemo(() => {
    const labels: Record<string, string> =
      groupBy === "muscle" ? MUSCLE_GROUP_LABELS : groupBy === "bodyPart" ? BODY_PART_LABELS : EQUIPMENT_LABELS;
    const map = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const key = groupKeyOf(ex);
      const arr = map.get(key) ?? [];
      arr.push(ex);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, label: labels[key], items }))
      .sort((a, b) => a.label.localeCompare(b.label, "ru"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, groupBy]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="max-w-md w-full mx-auto flex flex-col h-full">
        <div className="flex items-center justify-between px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-3 shrink-0">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 mb-3 shrink-0">
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

        <div className="flex gap-1.5 px-4 pb-3 shrink-0">
          <SegButton active={groupBy === "bodyPart"} onClick={() => setGroupBy("bodyPart")} label="Части тела" />
          <SegButton active={groupBy === "muscle"} onClick={() => setGroupBy("muscle")} label="Мышцы" />
          <SegButton active={groupBy === "equipment"} onClick={() => setGroupBy("equipment")} label="Инвентарь" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full rounded-2xl border-2 border-dashed border-border p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-muted mb-3"
          >
            <Plus size={16} /> Своё упражнение
          </button>

          <div className="flex flex-col gap-2">
            {groups.map((g) => {
              const open = query.length > 0 || openGroups.has(g.key);
              return (
                <div key={g.key} className="rounded-2xl bg-surface border border-border overflow-hidden">
                  <button
                    onClick={() => toggleGroup(g.key)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                  >
                    <span className="font-bold text-sm">
                      {g.label} <span className="text-muted font-semibold">· {g.items.length}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      color="var(--muted)"
                      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </button>
                  {open && (
                    <div className="px-2 pb-2 flex flex-col gap-1.5">
                      {g.items.map((ex) => {
                        const added = excludeIds.has(ex.id);
                        return (
                          <div
                            key={ex.id}
                            className="rounded-xl bg-surface-2 p-3 flex items-center gap-2"
                          >
                            <button
                              onClick={() => setDetailExercise(ex)}
                              className="flex-1 min-w-0 text-left flex items-center gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{ex.name}</p>
                                <p className="text-[11px] text-muted font-semibold">
                                  {secondaryLabelOf(ex)}
                                  {customIds.has(ex.id) && " · своё"}
                                </p>
                              </div>
                              <Info size={13} color="var(--muted)" className="shrink-0" />
                            </button>
                            <button
                              disabled={added}
                              onClick={() => {
                                onSelect(ex);
                                onClose();
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
                              style={{ background: added ? "var(--surface)" : "var(--accent)" }}
                              aria-label="Добавить"
                            >
                              {added ? <Check size={12} /> : <Plus size={12} color="var(--accent-foreground)" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {groups.length === 0 && <p className="text-sm text-muted text-center py-8">Ничего не найдено</p>}
          </div>
        </div>
      </div>

      {createOpen && (
        <CreateExerciseSheet
          onClose={() => setCreateOpen(false)}
          onCreated={(ex) => {
            setCreateOpen(false);
            onSelect(ex);
            onClose();
          }}
        />
      )}

      {detailExercise && (
        <ExerciseDetailSheet
          exercise={detailExercise}
          added={excludeIds.has(detailExercise.id)}
          onClose={() => setDetailExercise(null)}
          onAdd={() => {
            onSelect(detailExercise);
            setDetailExercise(null);
            onClose();
          }}
        />
      )}
    </div>
  );
}

function CreateExerciseSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (ex: Exercise) => void;
}) {
  const { addCustomExercise } = useStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MuscleGroup>("CHEST");
  const [equipment, setEquipment] = useState<Equipment>("BARBELL");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-w-md w-full mx-auto rounded-t-[28px] bg-background p-5 pb-[calc(24px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-black mb-4">Своё упражнение</h2>

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Название</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Жим в блочном тренажёре"
          className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none mb-4"
          autoFocus
        />

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Группа мышц</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((g) => (
            <button
              key={g}
              onClick={() => setCategory(g)}
              className="h-8 px-3 rounded-full text-xs font-bold"
              style={{
                background: category === g ? "var(--accent)" : "var(--surface-2)",
                color: category === g ? "var(--accent-foreground)" : "var(--muted)",
              }}
            >
              {MUSCLE_GROUP_LABELS[g]}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">Оборудование</p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((eq) => (
            <button
              key={eq}
              onClick={() => setEquipment(eq)}
              className="h-8 px-3 rounded-full text-xs font-bold"
              style={{
                background: equipment === eq ? "var(--accent)" : "var(--surface-2)",
                color: equipment === eq ? "var(--accent-foreground)" : "var(--muted)",
              }}
            >
              {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </div>

        <button
          onClick={async () => {
            if (!canSave) return;
            setSaving(true);
            try {
              const ex = await addCustomExercise(name.trim(), category, equipment);
              onCreated(ex);
            } finally {
              setSaving(false);
            }
          }}
          disabled={!canSave}
          className="w-full h-12 rounded-2xl font-bold disabled:opacity-40"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {saving ? "Добавляем…" : "Добавить и выбрать"}
        </button>
      </div>
    </div>
  );
}

function SegButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 h-9 rounded-xl text-[11px] font-bold px-1"
      style={{
        background: active ? "var(--accent)" : "var(--surface-2)",
        color: active ? "var(--accent-foreground)" : "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}
