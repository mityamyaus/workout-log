"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Flame, Heart, Search, Trash2, UserCheck, UserX } from "lucide-react";
import { api, NetworkError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  date: string;
  title: string;
  color: string;
  durationMin: number | null;
  exerciseCount: number;
  volume: number | null;
  exercises: { name: string; category: string; topSet: { weight: number; reps: number } | null }[];
  reactionCounts: Record<string, number>;
  myReaction: string | null;
}

interface FriendEntry {
  requestId: string;
  id: string;
  name: string;
  email: string;
  sessionsThisWeek?: number;
}

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<"feed" | "friends">("feed");

  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const data = await api.get<{ items: FeedItem[] }>("/api/feed");
      setFeed(data.items);
    } catch {
      setFeed([]);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const data = await api.get<{ friends: FriendEntry[]; incoming: FriendEntry[]; outgoing: FriendEntry[] }>(
        "/api/friends"
      );
      setFriends(data.friends);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch {
      // offline or not authenticated; leave lists empty
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadFriends();
  }, [loadFeed, loadFriends]);

  const handleSendRequest = async () => {
    const value = email.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.post("/api/friends", { email: value });
      setEmail("");
      await loadFriends();
    } catch (err) {
      if (err instanceof NetworkError) setError("Нет сети");
      else setError(err instanceof Error ? err.message : "Не получилось отправить запрос");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    await api.patch(`/api/friends/${requestId}`, { action: "accept" });
    await loadFriends();
  };

  const handleRemove = async (requestId: string) => {
    await api.delete(`/api/friends/${requestId}`);
    await loadFriends();
  };

  const handleReact = async (item: FeedItem, type: "LIKE" | "FIRE") => {
    setFeed((prev) =>
      prev
        ? prev.map((it) => {
            if (it.id !== item.id) return it;
            const counts = { ...it.reactionCounts };
            if (it.myReaction) counts[it.myReaction] = Math.max(0, (counts[it.myReaction] ?? 1) - 1);
            const nextReaction = it.myReaction === type ? null : type;
            if (nextReaction) counts[nextReaction] = (counts[nextReaction] ?? 0) + 1;
            return { ...it, reactionCounts: counts, myReaction: nextReaction };
          })
        : prev
    );
    try {
      await api.post("/api/feed/react", { sessionId: item.id, type });
    } catch {
      loadFeed();
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
        <h1 className="text-2xl font-black">Друзья</h1>
      </div>

      <div className="flex gap-1.5 mb-5">
        <SegButton active={tab === "feed"} onClick={() => setTab("feed")} label="Лента" />
        <SegButton
          active={tab === "friends"}
          onClick={() => setTab("friends")}
          label={`Друзья${friends.length ? ` · ${friends.length}` : ""}`}
        />
      </div>

      {tab === "feed" ? (
        <div className="flex flex-col gap-3">
          {feed === null && <p className="text-sm text-muted text-center py-8">Загружаем…</p>}
          {feed !== null && feed.length === 0 && (
            <p className="text-sm text-muted text-center py-8">
              Пока пусто. Добавь друзей во вкладке «Друзья», и здесь появятся их тренировки.
            </p>
          )}
          {feed?.map((item) => (
            <div key={item.id} className="rounded-3xl bg-surface border border-border p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-[11px] font-bold shrink-0">
                  {initials(item.userName, item.userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.userName}</p>
                  <p className="text-[11px] text-muted font-semibold">{formatDate(item.date)}</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              </div>
              <p className="font-bold text-sm mb-2.5">{item.title}</p>

              {item.exercises.some((e) => e.topSet) && (
                <div className="flex flex-col gap-1.5 mb-3">
                  {item.exercises
                    .filter((e) => e.topSet)
                    .slice(0, 4)
                    .map((e, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2">
                        <span className="text-xs truncate pr-2">{e.name}</span>
                        <span className="text-xs font-bold shrink-0" style={{ color: "var(--accent)" }}>
                          {e.topSet!.weight} кг × {e.topSet!.reps}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-4 mb-3">
                {item.durationMin !== null && (
                  <Stat label="время" value={`${item.durationMin} мин`} />
                )}
                <Stat label="упражнений" value={String(item.exerciseCount)} />
                {item.volume !== null && <Stat label="объём" value={`${(item.volume / 1000).toFixed(1)} т`} />}
              </div>

              <div className="flex gap-2">
                <ReactionPill
                  active={item.myReaction === "LIKE"}
                  icon={<Heart size={14} color={item.myReaction === "LIKE" ? "#ff6fae" : "var(--muted)"} />}
                  count={item.reactionCounts.LIKE ?? 0}
                  onClick={() => handleReact(item, "LIKE")}
                />
                <ReactionPill
                  active={item.myReaction === "FIRE"}
                  icon={<Flame size={14} color={item.myReaction === "FIRE" ? "#ffd93d" : "var(--muted)"} />}
                  count={item.reactionCounts.FIRE ?? 0}
                  onClick={() => handleReact(item, "FIRE")}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 bg-surface-2 rounded-2xl px-3.5 h-11 mb-1.5">
              <Search size={15} color="var(--muted)" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
                placeholder="Email друга"
                className="flex-1 bg-transparent text-sm font-semibold outline-none"
              />
              <button
                onClick={handleSendRequest}
                disabled={!email.trim() || sending}
                className="text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-40"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                {sending ? "…" : "Добавить"}
              </button>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          {incoming.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">
                Запросы в друзья · {incoming.length}
              </p>
              <div className="flex flex-col gap-2">
                {incoming.map((f) => (
                  <div key={f.requestId} className="flex items-center gap-2.5 rounded-2xl bg-surface border border-border p-3">
                    <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(f.name, f.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{f.name || f.email}</p>
                    </div>
                    <button
                      onClick={() => handleAccept(f.requestId)}
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--accent)" }}
                      aria-label="Принять"
                    >
                      <UserCheck size={15} color="var(--accent-foreground)" />
                    </button>
                    <button
                      onClick={() => handleRemove(f.requestId)}
                      className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0"
                      aria-label="Отклонить"
                    >
                      <UserX size={15} color="var(--muted)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">Мои друзья · {friends.length}</p>
            {friends.length === 0 ? (
              <p className="text-sm text-muted">Пока никого нет — добавь по email выше.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {friends.map((f) => (
                  <div key={f.requestId} className="flex items-center gap-2.5 rounded-2xl bg-surface border border-border p-3">
                    <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(f.name, f.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{f.name || f.email}</p>
                      <p className="text-[11px] text-muted">{f.sessionsThisWeek ?? 0} тренировки на этой неделе</p>
                    </div>
                    <button
                      onClick={() => handleRemove(f.requestId)}
                      className="p-1.5 text-muted shrink-0"
                      aria-label="Удалить из друзей"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {outgoing.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">
                Отправленные запросы · {outgoing.length}
              </p>
              <div className="flex flex-col gap-2">
                {outgoing.map((f) => (
                  <div key={f.requestId} className="flex items-center gap-2.5 rounded-2xl bg-surface border border-border p-3">
                    <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(f.name, f.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{f.name || f.email}</p>
                      <p className="text-[11px] text-muted">Ждём подтверждения</p>
                    </div>
                    <button
                      onClick={() => handleRemove(f.requestId)}
                      className="text-xs font-bold text-muted"
                    >
                      Отменить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted text-center px-4">
            {user?.shareWeights
              ? "Друзья видят твои рабочие веса — поменять можно в профиле."
              : "Друзья видят время и объём тренировок, но не веса — включить можно в профиле."}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[15px] font-bold" style={{ color: "var(--accent)" }}>{value}</p>
      <p className="text-[10px] text-muted font-semibold">{label}</p>
    </div>
  );
}

function ReactionPill({
  active,
  icon,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ background: active ? "var(--surface-2)" : "var(--surface-2)", outline: active ? "1.5px solid var(--border)" : "none" }}
    >
      {icon}
      <span className="text-xs font-bold">{count}</span>
    </button>
  );
}

function SegButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 h-9 rounded-xl text-[11px] font-bold px-1"
      style={{
        background: active ? "var(--accent)" : "var(--surface-2)",
        color: active ? "var(--accent-foreground)" : "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}
