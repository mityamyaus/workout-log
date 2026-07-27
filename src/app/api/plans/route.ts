import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await prisma.plannedWorkout.findMany({ where: { userId: user.id } });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.date || !body.title) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const row = await prisma.plannedWorkout.create({
    data: {
      userId: user.id,
      date: body.date,
      time: body.time ?? null,
      programId: body.programId ?? null,
      title: body.title,
      color: body.color || "#b6f000",
      reminderMinutesBefore: typeof body.reminderMinutesBefore === "number" ? body.reminderMinutesBefore : null,
      remindAt: body.remindAt ? new Date(body.remindAt) : null,
    },
  });

  return NextResponse.json(serialize(row));
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
