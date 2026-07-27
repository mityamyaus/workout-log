"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";

export default function SyncStatusBar() {
  const { online, pendingCount } = useStore();

  if (online && pendingCount === 0) return null;

  return (
    <div
      className="shrink-0 px-4 pb-2 flex items-center justify-center gap-2 text-xs font-bold"
      style={{
        background: online ? "var(--surface-2)" : "var(--danger)",
        color: online ? "var(--muted)" : "#fff",
        paddingTop: "calc(8px + env(safe-area-inset-top))",
      }}
    >
      {online ? (
        <>
          <RefreshCw size={13} className="animate-spin" /> Синхронизация{pendingCount > 1 ? ` (${pendingCount})` : ""}…
        </>
      ) : (
        <>
          <WifiOff size={13} /> Нет сети — изменения сохраняются локально
          {pendingCount > 0 ? ` (${pendingCount})` : ""}
        </>
      )}
    </div>
  );
}
