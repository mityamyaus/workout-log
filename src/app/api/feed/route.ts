import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";
import type { ExerciseLog } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const accepted = await prisma.friendRequest.findMany({
    where: { status: "ACCEPTED", OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
  });
  const friendIds = accepted.map((r) => (r.fromUserId === user.id ? r.toUserId : r.fromUserId));
  if (friendIds.length === 0) return NextResponse.json({ items: [] });

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: { in: friendIds }, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: 30,
    include: { user: true, reactions: true },
  });

  const items = sessions.map((s) => {
    const exercises = (s.exercises as unknown as ExerciseLog[]) ?? [];
    const shareWeights = s.user.shareWeights;
    const durationMin = s.finishedAt ? Math.round((s.finishedAt.getTime() - s.startedAt.getTime()) / 60000) : null;
    let volume: number | null = null;
    if (shareWeights) {
      volume = 0;
      for (const ex of exercises) {
        for (const set of ex.sets) {
          if (set.completed) volume += set.weight * set.reps;
        }
      }
    }

    const reactionCounts: Record<string, number> = {};
    let myReaction: string | null = null;
    for (const r of s.reactions) {
      reactionCounts[r.type] = (reactionCounts[r.type] ?? 0) + 1;
      if (r.userId === user.id) myReaction = r.type;
    }

    return {
      id: s.id,
      userId: s.userId,
      userName: s.user.name || s.user.email,
      date: s.date,
      title: s.title,
      color: s.color,
      finishedAt: s.finishedAt ? s.finishedAt.getTime() : null,
      durationMin,
      exerciseCount: exercises.length,
      volume,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        category: ex.category,
        topSet: shareWeights ? topSetOf(ex) : null,
      })),
      reactionCounts,
      myReaction,
    };
  });

  return NextResponse.json({ items });
}

function topSetOf(ex: ExerciseLog): { weight: number; reps: number } | null {
  const completed = ex.sets.filter((s) => s.completed);
  if (completed.length === 0) return null;
  return completed.reduce((best, s) => (s.weight > best.weight ? s : best), completed[0]);
}
