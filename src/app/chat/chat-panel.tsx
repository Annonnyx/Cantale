"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ChatSource = "mc" | "discord" | "web" | "system" | "faction";
type Scope = "global" | "faction";

type ChatMessage = {
  id: number;
  source: ChatSource;
  playerUuid: string | null;
  playerName: string;
  message: string;
  factionId: number | null;
  createdAt: string;
};

const POLL_MS = 2_500;
const MAX_CHARS = 256;

const SOURCE_LABEL: Record<ChatSource, string> = {
  mc: "MC",
  discord: "Discord",
  web: "Web",
  system: "Système",
  faction: "Fac",
};

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ChatPanel({
  initialMessages,
  canSpeakGlobal,
  hasFaction,
  factionName,
  speaker,
}: {
  initialMessages: ChatMessage[];
  canSpeakGlobal: boolean;
  hasFaction: boolean;
  factionName: string | null;
  speaker: string | null;
}) {
  const [scope, setScope] = useState<Scope>("global");
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const listRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(initialMessages.at(-1)?.id ?? 0);
  const scopeRef = useRef<Scope>("global");

  const canSpeak = scope === "global" ? canSpeakGlobal : hasFaction;

  useEffect(() => {
    scopeRef.current = scope;
    lastIdRef.current = 0;
    setMessages([]);
    setError(null);
  }, [scope]);

  useEffect(() => {
    lastIdRef.current = messages.at(-1)?.id ?? lastIdRef.current;
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const currentScope = scopeRef.current;
      try {
        const after = lastIdRef.current;
        const url =
          after > 0
            ? `/api/chat?scope=${currentScope}&after=${after}&limit=80`
            : `/api/chat?scope=${currentScope}&limit=80`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setLive(false);
        } else {
          const data = (await res.json()) as { messages?: ChatMessage[] };
          if (!cancelled && scopeRef.current === currentScope) {
            setLive(true);
            const incoming = data.messages ?? [];
            if (after <= 0) {
              setMessages(incoming);
              lastIdRef.current = incoming.at(-1)?.id ?? 0;
            } else if (incoming.length > 0) {
              setMessages((prev) => {
                const seen = new Set(prev.map((m) => m.id));
                const merged = [...prev];
                for (const msg of incoming) {
                  if (!seen.has(msg.id)) merged.push(msg);
                }
                const next = merged.slice(-200);
                lastIdRef.current = next.at(-1)?.id ?? lastIdRef.current;
                return next;
              });
            }
          }
        }
      } catch {
        if (!cancelled) setLive(false);
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    };

    timer = setTimeout(poll, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scope]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSpeak || sending) return;
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, scope }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      setDraft("");
    } catch {
      setError("Réseau indisponible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-iron-line bg-iron">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-iron-line/60 px-4 py-3 sm:px-5">
        <div className="flex gap-2" role="tablist" aria-label="Canal de chat">
          <button
            type="button"
            role="tab"
            aria-selected={scope === "global"}
            onClick={() => setScope("global")}
            className={`pressable border px-3 py-2 font-tech text-[10px] uppercase tracking-[0.22em] ${
              scope === "global"
                ? "border-ember text-ember-glow"
                : "border-iron-line text-steel-light hover:text-bone"
            }`}
          >
            Global
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "faction"}
            disabled={!hasFaction}
            onClick={() => hasFaction && setScope("faction")}
            className={`pressable border px-3 py-2 font-tech text-[10px] uppercase tracking-[0.22em] disabled:opacity-40 ${
              scope === "faction"
                ? "border-ember text-ember-glow"
                : "border-iron-line text-steel-light hover:text-bone"
            }`}
            title={hasFaction ? factionName ?? "Faction" : "Rejoins une faction pour ouvrir cet onglet"}
          >
            Faction{factionName ? ` · ${factionName}` : ""}
          </button>
        </div>
        <span
          className={`font-tech text-[10px] uppercase tracking-[0.22em] ${live ? "text-steel-light" : "text-ember"}`}
        >
          {live ? "En direct" : "Hors ligne"}
        </span>
      </div>

      <div
        ref={listRef}
        className="flex h-[min(60vh,28rem)] flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="font-tech text-xs uppercase tracking-[0.2em] text-steel">
            {scope === "faction"
              ? "Aucun message de faction pour l'instant. En jeu : /fc ou /f c"
              : "Le fil est silencieux — les messages du serveur apparaîtront ici."}
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="border-b border-iron-line/30 pb-3 last:border-b-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
                  {formatTime(msg.createdAt)}
                </span>
                <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-ember-glow">
                  {SOURCE_LABEL[msg.source] ?? msg.source}
                </span>
                <span className="font-display text-sm font-semibold text-bone">{msg.playerName}</span>
              </div>
              <p className="mt-1 break-words text-sm leading-relaxed text-steel-light">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-iron-line/60 px-4 py-4 sm:px-5">
        {canSpeak ? (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="chat-draft"
                type="text"
                value={draft}
                maxLength={MAX_CHARS}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  scope === "faction"
                    ? `Faction${factionName ? ` ${factionName}` : ""}…`
                    : speaker
                      ? `Parler en tant que ${speaker}…`
                      : "Ton message…"
                }
                disabled={sending}
                className="min-w-0 flex-1 border border-iron-line bg-ash-deep px-4 py-3 font-sans text-sm text-bone placeholder:text-steel focus:border-ember focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="pressable border border-ember px-5 py-3 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone disabled:opacity-40"
              >
                {sending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
            {error && (
              <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-ember">{error}</p>
            )}
            <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
              {scope === "faction"
                ? "Visible uniquement pour ta faction (~2 s). En jeu : /fc"
                : "Visible en jeu sous [Web] — délai ~2 s."}
            </p>
          </form>
        ) : scope === "faction" ? (
          <p className="text-sm text-steel-light">
            Rejoins une faction (compte lié) pour utiliser cet onglet. En jeu :{" "}
            <span className="font-tech text-ember-glow">/fc</span> bascule le chat faction.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-steel-light">
            Lecture libre. Pour parler,{" "}
            <Link href="/connexion" className="nav-link text-ember-glow hover:text-bone">
              connecte-toi et lie ton compte Minecraft
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
