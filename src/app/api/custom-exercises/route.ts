import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await prisma.customExercise.findMany({ where: { userId: user.id } });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.category || !body.equipment) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const row = await prisma.customExercise.create({
    data: { userId: user.id, name: body.name, category: body.category, equipment: body.equipment },
  });

  return NextResponse.json(serialize(row));
}

function serialize(row: { id: string; name: string; category: string; equipment: string }) {
  return { id: row.id, name: row.name, category: row.category, equipment: row.equipment };
}
