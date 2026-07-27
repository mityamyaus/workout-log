"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, LogOut, User, Bell, BellOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getPushSubscriptionState, subscribeToPush, unsubscribeFromPush, isPushSupported } from "@/lib/push";

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, updateProfile, logWeight, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [age, setAge] = useState(user?.age?.toString() ?? "");
  const [weight, setWeight] = useState(user?.weight?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushState, setPushState] = useState<"unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading">(
    "loading"
  );

  useEffect(() => {
    if (!ready || !user) return;
    setName(user.name);
    setAge(user.age?.toString() ?? "");
    setWeight(user.weight?.toString() ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.id]);

  useEffect(() => {
    if (!isPushSupported()) {
      setPushState("unsupported");
      return;
    }
    getPushSubscriptionState().then(setPushState);
  }, []);

  const handleToggleNotifications = async () => {
    if (pushState === "subscribed") {
      await unsubscribeFromPush();
      setPushState("unsubscribed");
    } else {
      const ok = await subscribeToPush();
      setPushState(ok ? "subscribed" : Notification.permission === "denied" ? "denied" : "unsubscribed");
    }
  };

  if (!ready || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, age: age ? Number(age) : null });
      if (weight) await logWeight(Number(weight));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Выйти из аккаунта?")) {
      await logout();
      router.replace("/login");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/")}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-black">Профиль</h1>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{ background: "var(--accent)" }}
        >
          <User size={32} color="var(--accent-foreground)" />
        </div>
        <p className="font-bold text-lg">{user.name || "Без имени"}</p>
        <p className="text-xs text-muted mt-0.5">{user.email}</p>
      </div>

      <div className="rounded-3xl bg-surface border border-border p-5 flex flex-col gap-4 mb-5">
        <Field label="Имя">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Твоё имя"
            className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none"
          />
        </Field>
        <Field label="Возраст">
          <input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Лет"
            className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none"
          />
        </Field>
        <Field label="Текущий вес, кг">
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            className="w-full h-11 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold outline-none"
          />
        </Field>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-2xl font-bold disabled:opacity-40"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        {saving ? "Сохраняем…" : saved ? "Сохранено ✓" : "Сохранить"}
      </button>

      {pushState !== "unsupported" && (
        <button
          onClick={handleToggleNotifications}
          disabled={pushState === "denied" || pushState === "loading"}
          className="w-full rounded-3xl bg-surface border border-border p-4 flex items-center gap-3 mt-5 disabled:opacity-60 text-left"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: pushState === "subscribed" ? "var(--accent)" : "var(--surface-2)" }}
          >
            {pushState === "subscribed" ? (
              <Bell size={16} color="var(--accent-foreground)" />
            ) : (
              <BellOff size={16} color="var(--muted)" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Уведомления о тренировках</p>
            <p className="text-xs text-muted mt-0.5">
              {pushState === "subscribed" && "Включены"}
              {pushState === "unsubscribed" && "Выключены — нажми, чтобы включить"}
              {pushState === "denied" && "Заблокированы в настройках браузера"}
              {pushState === "loading" && "Проверяем…"}
            </p>
          </div>
        </button>
      )}

      {user.weightLog.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">История веса</p>
          <div className="rounded-3xl bg-surface border border-border p-4 flex flex-col gap-2">
            {[...user.weightLog]
              .slice(-10)
              .reverse()
              .map((e) => (
                <div key={e.date} className="flex items-center justify-between text-sm">
                  <span className="text-muted font-semibold">{e.date}</span>
                  <span className="font-bold">{e.weight} кг</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="w-full h-11 rounded-2xl font-bold text-sm text-danger flex items-center justify-center gap-2 mt-6"
      >
        <LogOut size={16} /> Выйти из аккаунта
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5">{label}</p>
      {children}
    </div>
  );
}
