"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Check, Plus, Search, X } from "lucide-react";
import {
  EXERCISES,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  type Exercise,
  type MuscleGroup,
  type Equipment,
} from "@/lib/exercises";

type GroupBy = "muscle" | "equipment";

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
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("muscle");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query) return EXERCISES;
    const q = query.toLowerCase();
    return EXERCISES.filter((e) => e.name.toLowerCase().includes(q));
  }, [query]);

  const groups = useMemo(() => {
    const labels: Record<string, string> = groupBy === "muscle" ? MUSCLE_GROUP_LABELS : EQUIPMENT_LABELS;
    const map = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const key = groupBy === "muscle" ? ex.category : ex.equipment;
      const arr = map.get(key) ?? [];
      arr.push(ex);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, label: labels[key], items }))
      .sort((a, b) => a.label.localeCompare(b.label, "ru"));
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

        <div className="flex gap-2 px-4 pb-3 shrink-0">
          <SegButton active={groupBy === "muscle"} onClick={() => setGroupBy("muscle")} label="По группам мышц" />
          <SegButton active={groupBy === "equipment"} onClick={() => setGroupBy("equipment")} label="По оборудованию" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
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
                          <button
                            key={ex.id}
                            disabled={added}
                            onClick={() => {
                              onSelect(ex);
                              onClose();
                            }}
                            className="rounded-xl bg-surface-2 p-3 flex items-center justify-between text-left disabled:opacity-40"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{ex.name}</p>
                              <p className="text-[11px] text-muted font-semibold">
                                {groupBy === "muscle" ? EQUIPMENT_LABELS[ex.equipment] : MUSCLE_GROUP_LABELS[ex.category]}
                              </p>
                            </div>
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-2"
                              style={{ background: added ? "var(--surface)" : "var(--accent)" }}
                            >
                              {added ? <Check size={12} /> : <Plus size={12} color="var(--accent-foreground)" />}
                            </div>
                          </button>
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
    </div>
  );
}

function SegButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 h-9 rounded-xl text-xs font-bold"
      style={{
        background: active ? "var(--accent)" : "var(--surface-2)",
        color: active ? "var(--accent-foreground)" : "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}
