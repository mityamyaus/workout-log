import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await prisma.workoutSession.findMany({
    where: { userId: user.id },
    orderBy: { finishedAt: "desc" },
  });

  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.date || !Array.isArray(body.exercises)) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const row = await prisma.workoutSession.create({
    data: {
      userId: user.id,
      date: body.date,
      title: body.title || "Тренировка",
      startedAt: new Date(body.startedAt),
      finishedAt: body.finishedAt ? new Date(body.finishedAt) : new Date(),
      programId: body.programId ?? null,
      color: body.color || "#b6f000",
      exercises: body.exercises as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(serialize(row));
}

function serialize(row: {
  id: string;
  date: string;
  title: string;
  startedAt: Date;
  finishedAt: Date | null;
  programId: string | null;
  color: string;
  exercises: unknown;
}) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    startedAt: row.startedAt.getTime(),
    finishedAt: row.finishedAt ? row.finishedAt.getTime() : null,
    programId: row.programId,
    color: row.color,
    exercises: row.exercises,
  };
}
