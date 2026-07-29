"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
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

export default function GenerateProgramPage() {
  const router = useRouter();
  const { saveProgram } = useStore();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const canGenerate = goal !== null && location !== null && days !== null && !saving;

  const handleGenerate = async () => {
    if (!goal || !location || !days || saving) return;
    setSaving(true);
    try {
      const generated = generatePrograms(goal, location, days);
      for (const program of generated) {
        await saveProgram(program);
      }
      router.push("/programs");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-black">Подбор программы</h1>
      </div>

      <p className="text-sm text-muted mb-5">
        Ответь на пару вопросов — подберём программу тренировок и сразу добавим её (или несколько, по одной на
        тренировочный день) в твой список программ.
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
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full h-14 rounded-2xl font-black text-lg disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        <Sparkles size={18} />
        {saving ? "Подбираем…" : "Подобрать программу"}
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
