"use client";

import { Minus, Plus } from "lucide-react";

export default function Stepper({
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
