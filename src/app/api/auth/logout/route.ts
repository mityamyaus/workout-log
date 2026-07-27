import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/server/db";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/server/auth";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { token } });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
