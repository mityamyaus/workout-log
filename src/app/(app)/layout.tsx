"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <StoreProvider>
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</main>
      <BottomNav />
    </StoreProvider>
  );
}
