"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import ProgramBuilder from "@/components/ProgramBuilder";

export default function EditProgramPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { programs, ready } = useStore();
  const program = programs.find((p) => p.id === id);

  useEffect(() => {
    if (ready && !program) router.replace("/programs");
  }, [ready, program, router]);

  if (!ready || !program) return null;

  return <ProgramBuilder existing={program} />;
}
