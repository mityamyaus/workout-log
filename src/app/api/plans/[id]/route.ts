import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await prisma.plannedWorkout.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || !body.date || !body.title) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  try {
    const row = await prisma.plannedWorkout.update({
      where: { id, userId: user.id },
      data: {
        date: body.date,
        time: body.time ?? null,
        programId: body.programId ?? null,
        title: body.title,
        color: body.color || "#b6f000",
        reminderMinutesBefore: typeof body.reminderMinutesBefore === "number" ? body.reminderMinutesBefore : null,
        remindAt: body.remindAt ? new Date(body.remindAt) : null,
        reminderSentAt: null,
      },
    });
    return NextResponse.json(serialize(row));
  } catch {
    return NextResponse.json({ error: "План не найден" }, { status: 404 });
  }
}

function serialize(row: {
  id: string;
  date: string;
  time: string | null;
  programId: string | null;
  title: string;
  color: string;
  reminderMinutesBefore: number | null;
  remindAt: Date | null;
}) {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    programId: row.programId,
    title: row.title,
    color: row.color,
    reminderMinutesBefore: row.reminderMinutesBefore,
    remindAt: row.remindAt ? row.remindAt.getTime() : null,
  };
}
