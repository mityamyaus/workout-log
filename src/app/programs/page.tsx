"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ProgramsPage() {
  const router = useRouter();
  const { programs, ready } = useStore();

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/workout")}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-black">Мои программы</h1>
      </div>

      <Link
        href="/programs/new"
        className="rounded-3xl border-2 border-dashed border-border p-4 flex items-center justify-center gap-2 text-sm font-bold text-muted mb-4"
      >
        <Plus size={16} /> Новая программа
      </Link>

      {programs.length === 0 && (
        <p className="text-sm text-muted text-center py-6">Пока нет сохранённых программ</p>
      )}

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
              <p className="text-xs text-muted mt-0.5">{p.exercises.length} упражнений</p>
            </div>
            <Pencil size={16} color="var(--muted)" />
          </Link>
        ))}
      </div>
    </div>
  );
}
