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
      programId: body.programId ?? null,
      title: body.title,
      color: body.color || "#b6f000",
    },
  });

  return NextResponse.json(serialize(row));
}

function serialize(row: { id: string; date: string; programId: string | null; title: string; color: string }) {
  return { id: row.id, date: row.date, programId: row.programId, title: row.title, color: row.color };
}
