import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

const ALLOWED_TYPES = ["LIKE", "FIRE"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const type = typeof body?.type === "string" ? body.type : "";
  if (!sessionId || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Тренировка не найдена" }, { status: 404 });

  if (session.userId !== user.id) {
    const friendship = await prisma.friendRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { fromUserId: user.id, toUserId: session.userId },
          { fromUserId: session.userId, toUserId: user.id },
        ],
      },
    });
    if (!friendship) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const existing = await prisma.reaction.findUnique({
    where: { sessionId_userId: { sessionId, userId: user.id } },
  });

  if (!existing) {
    await prisma.reaction.create({ data: { sessionId, userId: user.id, type } });
    return NextResponse.json({ myReaction: type });
  }
  if (existing.type === type) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ myReaction: null });
  }
  await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
  return NextResponse.json({ myReaction: type });
}
