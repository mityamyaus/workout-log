import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (
    !body ||
    !body.exerciseId ||
    !body.exerciseName ||
    (body.targetType !== "WEIGHT" && body.targetType !== "VOLUME") ||
    typeof body.targetValue !== "number" ||
    typeof body.startValue !== "number" ||
    !body.startDate
  ) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const row = await prisma.goal.create({
    data: {
      userId: user.id,
      exerciseId: body.exerciseId,
      exerciseName: body.exerciseName,
      targetType: body.targetType,
      targetValue: body.targetValue,
      targetReps: typeof body.targetReps === "number" ? body.targetReps : null,
      startValue: body.startValue,
      startDate: body.startDate,
      deadline: typeof body.deadline === "string" ? body.deadline : null,
    },
  });

  return NextResponse.json(serialize(row));
}

function serialize(row: {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetType: string;
  targetValue: number;
  targetReps: number | null;
  startValue: number;
  startDate: string;
  deadline: string | null;
  archived: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    exerciseName: row.exerciseName,
    targetType: row.targetType,
    targetValue: row.targetValue,
    targetReps: row.targetReps,
    startValue: row.startValue,
    startDate: row.startDate,
    deadline: row.deadline,
    archived: row.archived,
    createdAt: row.createdAt.getTime(),
  };
}
