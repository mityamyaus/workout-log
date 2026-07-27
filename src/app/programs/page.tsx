"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ListChecks, Pencil, Plus } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ProgramsPage() {
  const router = useRouter();
  const { programs, draft, ready, startDraft, startProgram } = useStore();

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-black mb-4">Программы</h1>

      {draft && (
        <div className="rounded-3xl p-5 mb-5" style={{ background: "var(--accent)" }}>
          <span className="text-[11px] font-bold uppercase tracking-wide text-black/60">Тренировка в процессе</span>
          <p className="text-xl font-black text-black mt-1 mb-4">{draft.title}</p>
          <button
            onClick={() => router.push("/workout")}
            className="w-full h-12 rounded-2xl bg-black text-white font-bold flex items-center justify-center gap-2"
          >
            Продолжить <ArrowRight size={18} />
          </button>
        </div>
      )}

      {!draft && (
        <button
          onClick={() => {
            startDraft();
            router.push("/workout");
          }}
          className="w-full h-12 rounded-2xl border-2 border-dashed border-border font-bold text-sm text-muted flex items-center justify-center gap-2 mb-5"
        >
          <Plus size={16} /> Начать с нуля
        </button>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Мои программы</span>
        <Link href="/programs/new" className="text-[11px] font-bold flex items-center gap-1" style={{ color: "var(--accent)" }}>
          <Plus size={13} /> Новая
        </Link>
      </div>

      {programs.length === 0 && (
        <div className="rounded-3xl bg-surface border border-border p-6 text-center text-sm text-muted">
          Пока нет сохранённых программ
        </div>
      )}

      <div className="flex flex-col gap-2">
        {programs.map((p) => (
          <div key={p.id} className="rounded-3xl bg-surface border border-border p-4 flex items-center gap-3">
            <button
              onClick={() => {
                if (draft) {
                  if (!confirm("Уже есть тренировка в процессе. Начать новую вместо неё?")) return;
                }
                startProgram(p.id);
                router.push("/workout");
              }}
              className="flex-1 min-w-0 flex items-center gap-3 text-left"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{p.name}</p>
                <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                  <ListChecks size={12} /> {p.exercises.length} упражнений
                </p>
              </div>
            </button>
            <Link href={`/programs/${p.id}/edit`} className="p-1.5 text-muted shrink-0">
              <Pencil size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
