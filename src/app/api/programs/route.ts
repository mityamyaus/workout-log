import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await prisma.program.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.name || !Array.isArray(body.exercises)) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const data = {
    name: body.name as string,
    color: body.color as string,
    exercises: body.exercises as Prisma.InputJsonValue,
  };

  try {
    const row = body.id
      ? await prisma.program.update({
          where: { id: body.id, userId: user.id },
          data,
        })
      : await prisma.program.create({ data: { ...data, userId: user.id } });

    return NextResponse.json(serialize(row));
  } catch {
    return NextResponse.json({ error: "Программа не найдена" }, { status: 404 });
  }
}

function serialize(row: { id: string; name: string; color: string; exercises: unknown; createdAt: Date }) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    exercises: row.exercises,
    createdAt: row.createdAt.getTime(),
  };
}
