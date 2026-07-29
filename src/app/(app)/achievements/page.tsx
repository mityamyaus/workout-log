"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ChevronLeft, Flame, Lock, Target, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeAchievements, type Achievement, type AchievementIcon } from "@/lib/achievements";

const ICONS: Record<AchievementIcon, React.ComponentType<{ size?: number; color?: string }>> = {
  flame: Flame,
  barbell: Trophy,
  trophy: Trophy,
  target: Target,
};

const ICON_BG: Record<AchievementIcon, string> = {
  flame: "#3a3320",
  barbell: "#233a2a",
  trophy: "#3a3320",
  target: "#2a2340",
};

const ICON_COLOR: Record<AchievementIcon, string> = {
  flame: "#ffd93d",
  barbell: "#5dcaa5",
  trophy: "#ffd93d",
  target: "#b18cff",
};

export default function AchievementsPage() {
  const router = useRouter();
  const { sessions, ready } = useStore();

  const achievements = useMemo(() => computeAchievements(sessions), [sessions]);
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/profile")}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-black">Достижения</h1>
      </div>

      <p className="text-sm text-muted mb-5">
        {unlockedCount} из {achievements.length} открыто
      </p>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a) => (
          <AchievementCard key={a.key} achievement={a} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const unlocked = Boolean(achievement.unlockedAt);
  const Icon = ICONS[achievement.icon];

  return (
    <div
      className="rounded-2xl p-3.5 text-center"
      style={{
        background: unlocked ? "var(--surface)" : "var(--surface-2)",
        border: unlocked ? "1px solid var(--border)" : "1px dashed var(--border)",
        opacity: unlocked ? 1 : 0.65,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
        style={{ background: unlocked ? ICON_BG[achievement.icon] : "var(--surface)" }}
      >
        {unlocked ? (
          <Icon size={19} color={ICON_COLOR[achievement.icon]} />
        ) : (
          <Lock size={17} color="var(--muted)" />
        )}
      </div>
      <p className="text-xs font-bold">{achievement.title}</p>
      <p className="text-[10px] text-muted mt-0.5">
        {unlocked ? `получено ${formatDate(achievement.unlockedAt!)}` : achievement.progressLabel}
      </p>
    </div>
  );
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}
