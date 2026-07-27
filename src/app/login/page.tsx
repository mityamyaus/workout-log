"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  if (!ready || user) return null;

  return (
    <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 pb-10 overflow-y-auto">
      <h1 className="text-3xl font-black mb-1">Вход</h1>
      <p className="text-sm text-muted mb-6">Дневник тренировок</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="h-12 rounded-2xl bg-surface-2 px-4 text-sm font-semibold outline-none"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="h-12 rounded-2xl bg-surface-2 px-4 text-sm font-semibold outline-none"
        />
        {error && <p className="text-sm text-danger font-semibold">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-2xl font-bold disabled:opacity-40 mt-2"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-bold" style={{ color: "var(--accent)" }}>
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
