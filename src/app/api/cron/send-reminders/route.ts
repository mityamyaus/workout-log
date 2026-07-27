import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { sendPushToUser } from "@/lib/server/push";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const graceWindowStart = new Date(now.getTime() - 10 * 60 * 1000);

  const due = await prisma.plannedWorkout.findMany({
    where: {
      reminderSentAt: null,
      remindAt: { lte: now, gte: graceWindowStart },
    },
  });

  let sent = 0;
  for (const plan of due) {
    await sendPushToUser(plan.userId, {
      title: "Пора тренироваться",
      body: plan.time ? `${plan.title} в ${plan.time}` : plan.title,
      url: "/",
    });
    await prisma.plannedWorkout.update({ where: { id: plan.id }, data: { reminderSentAt: now } });
    sent++;
  }

  return NextResponse.json({ checked: due.length, sent });
}
