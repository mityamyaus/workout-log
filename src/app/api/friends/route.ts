import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

function startOfWeekStr() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const requests = await prisma.friendRequest.findMany({
    where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
    include: { fromUser: true, toUser: true },
    orderBy: { createdAt: "desc" },
  });

  const accepted = requests.filter((r) => r.status === "ACCEPTED");
  const incoming = requests.filter((r) => r.status === "PENDING" && r.toUserId === user.id);
  const outgoing = requests.filter((r) => r.status === "PENDING" && r.fromUserId === user.id);

  const weekStart = startOfWeekStr();
  const friendIds = accepted.map((r) => (r.fromUserId === user.id ? r.toUserId : r.fromUserId));
  const weekCounts = friendIds.length
    ? await prisma.workoutSession.groupBy({
        by: ["userId"],
        where: { userId: { in: friendIds }, date: { gte: weekStart }, finishedAt: { not: null } },
        _count: { _all: true },
      })
    : [];
  const weekCountByUser = new Map(weekCounts.map((c) => [c.userId, c._count._all]));

  return NextResponse.json({
    friends: accepted.map((r) => {
      const other = r.fromUserId === user.id ? r.toUser : r.fromUser;
      return {
        requestId: r.id,
        id: other.id,
        name: other.name,
        email: other.email,
        sessionsThisWeek: weekCountByUser.get(other.id) ?? 0,
      };
    }),
    incoming: incoming.map((r) => ({ requestId: r.id, id: r.fromUser.id, name: r.fromUser.name, email: r.fromUser.email })),
    outgoing: outgoing.map((r) => ({ requestId: r.id, id: r.toUser.id, name: r.toUser.name, email: r.toUser.email })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Укажи email" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Это твой собственный email" }, { status: 400 });

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { fromUserId: user.id, toUserId: target.id },
        { fromUserId: target.id, toUserId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "Вы уже друзья" }, { status: 409 });
    }
    if (existing.fromUserId === target.id) {
      const accepted = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      return NextResponse.json({ status: "ACCEPTED", requestId: accepted.id });
    }
    return NextResponse.json({ error: "Запрос уже отправлен" }, { status: 409 });
  }

  const created = await prisma.friendRequest.create({ data: { fromUserId: user.id, toUserId: target.id } });
  return NextResponse.json({ status: "PENDING", requestId: created.id });
}
