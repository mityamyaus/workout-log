import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await prisma.program.deleteMany({ where: { id, userId: user.id } });
  await prisma.plannedWorkout.deleteMany({ where: { programId: id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
