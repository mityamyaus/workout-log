import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";
import type { WeightEntry } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  return NextResponse.json({
    name: user.name,
    age: user.age,
    weight: user.weight,
    weightLog: user.weightLog,
    shareWeights: user.shareWeights,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  const data: Prisma.UserUpdateInput = {};
  if (typeof body.name === "string") data.name = body.name;
  if (body.age === null || typeof body.age === "number") data.age = body.age;
  if (typeof body.shareWeights === "boolean") data.shareWeights = body.shareWeights;

  if (typeof body.weight === "number") {
    const date = typeof body.date === "string" ? body.date : todayStr();
    const existingLog = Array.isArray(user.weightLog) ? (user.weightLog as unknown as WeightEntry[]) : [];
    const weightLog = [...existingLog.filter((e) => e.date !== date), { date, weight: body.weight }].sort((a, b) =>
      a.date < b.date ? -1 : 1
    );
    data.weight = body.weight;
    data.weightLog = weightLog as unknown as Prisma.InputJsonValue;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({
    name: updated.name,
    age: updated.age,
    weight: updated.weight,
    weightLog: updated.weightLog,
    shareWeights: updated.shareWeights,
  });
}
