import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (body?.action !== "accept") return NextResponse.json({ error: "Некорректное действие" }, { status: 400 });

  const request = await prisma.friendRequest.findUnique({ where: { id } });
  if (!request || request.toUserId !== user.id || request.status !== "PENDING") {
    return NextResponse.json({ error: "Запрос не найден" }, { status: 404 });
  }

  const updated = await prisma.friendRequest.update({
    where: { id },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;

  const request = await prisma.friendRequest.findUnique({ where: { id } });
  if (!request || (request.fromUserId !== user.id && request.toUserId !== user.id)) {
    return NextResponse.json({ error: "Запрос не найден" }, { status: 404 });
  }

  await prisma.friendRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
