import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id },
    orderBy: { finishedAt: "desc" },
  });
  const programs = await prisma.program.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const plans = await prisma.plannedWorkout.findMany({ where: { userId: user.id } });
  const customExercises = await prisma.customExercise.findMany({ where: { userId: user.id } });
  const goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return NextResponse.json({
    sessions: sessions.map((row) => ({
      id: row.id,
      date: row.date,
      title: row.title,
      startedAt: row.startedAt.getTime(),
      finishedAt: row.finishedAt ? row.finishedAt.getTime() : null,
      programId: row.programId,
      color: row.color,
      exercises: row.exercises,
    })),
    programs: programs.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      exercises: row.exercises,
      createdAt: row.createdAt.getTime(),
    })),
    plans: plans.map((row) => ({
      id: row.id,
      date: row.date,
      time: row.time,
      programId: row.programId,
      title: row.title,
      color: row.color,
      reminderMinutesBefore: row.reminderMinutesBefore,
      remindAt: row.remindAt ? row.remindAt.getTime() : null,
    })),
    customExercises: customExercises.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      equipment: row.equipment,
    })),
    goals: goals.map((row) => ({
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
    })),
  });
}
