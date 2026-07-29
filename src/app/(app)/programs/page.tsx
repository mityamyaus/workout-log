"use client";

import Link from "next/link";
import { ListChecks, Pencil, Plus, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ProgramsPage() {
  const { programs, ready } = useStore();

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-black mb-4">Программы</h1>

      {programs.length === 0 ? (
        <>
          <Link
            href="/programs/new"
            className="rounded-3xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center gap-2 text-center mb-3"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={22} color="var(--accent-foreground)" />
            </div>
            <p className="font-bold">Составить программу</p>
            <p className="text-xs text-muted max-w-[220px]">
              Название, цвет, упражнения с подходами и повторениями
            </p>
          </Link>
          <Link
            href="/programs/generate"
            className="rounded-3xl bg-surface border border-border p-4 flex items-center justify-center gap-2 text-center font-bold text-sm"
          >
            <Sparkles size={16} color="var(--accent)" /> Подобрать программу автоматически
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/programs/new"
            className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-2"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            <Plus size={16} /> Новая программа
          </Link>
          <Link
            href="/programs/generate"
            className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-4 bg-surface border border-border"
          >
            <Sparkles size={16} color="var(--accent)" /> Подобрать программу автоматически
          </Link>
          <div className="flex flex-col gap-2">
            {programs.map((p) => (
              <Link
                key={p.id}
                href={`/programs/${p.id}/edit`}
                className="rounded-3xl bg-surface border border-border p-4 flex items-center gap-3"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                    <ListChecks size={12} /> {p.exercises.length} упражнений
                  </p>
                </div>
                <Pencil size={16} color="var(--muted)" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
