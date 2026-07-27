"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { user, ready, register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
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
      await register(email.trim().toLowerCase(), password, name.trim());
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось зарегистрироваться");
    } finally {
      setLoading(false);
    }
  };

  if (!ready || user) return null;

  return (
    <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 pb-10 overflow-y-auto">
      <h1 className="text-3xl font-black mb-1">Регистрация</h1>
      <p className="text-sm text-muted mb-6">Создай аккаунт, чтобы данные были доступны с любого устройства</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          className="h-12 rounded-2xl bg-surface-2 px-4 text-sm font-semibold outline-none"
        />
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
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль (минимум 6 символов)"
          className="h-12 rounded-2xl bg-surface-2 px-4 text-sm font-semibold outline-none"
        />
        {error && <p className="text-sm text-danger font-semibold">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-2xl font-bold disabled:opacity-40 mt-2"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {loading ? "Создаём…" : "Зарегистрироваться"}
        </button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-bold" style={{ color: "var(--accent)" }}>
          Войти
        </Link>
      </p>
    </div>
  );
}
