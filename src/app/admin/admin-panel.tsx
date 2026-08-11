"use client";

import { useCallback, useEffect, useState } from "react";

type OnlinePlayer = { uuid: string; name: string };
type Ticket = { id: string; name: string; topic: string | null; open: boolean; url: string };
type PlayerInfo = {
  uuid: string;
  username: string;
  lives: number;
  balance: number;
  discordId: string | null;
};

const ITEM_TYPES = [
  "VIE",
  "CANTALAME",
  "RUNE_FORTIFICATION",
  "PICKANTAXE_DIAMOND_3X3",
  "MULTI_CANTOOL_DIAMOND_1X1",
  "CANTAXE_DIAMOND",
  "GARDE_HELMET",
  "GARDE_CHESTPLATE",
  "GARDE_LEGGINGS",
  "GARDE_BOOTS",
];

export function AdminPanel() {
  const [online, setOnline] = useState(0);
  const [max, setMax] = useState<number | null>(null);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [payload, setPayload] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const pushLog = (line: string) => setLog((prev) => [line, ...prev].slice(0, 40));

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        online: number;
        max: number | null;
        players: OnlinePlayer[];
        tickets: Ticket[];
        updatedAt: string | null;
      };
      setOnline(data.online);
      setMax(data.max);
      setPlayers(data.players ?? []);
      setTickets(data.tickets ?? []);
      setUpdatedAt(data.updatedAt);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function lookup() {
    if (!target.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/player?q=${encodeURIComponent(target.trim())}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { player?: PlayerInfo; error?: string };
      if (!res.ok) {
        setPlayer(null);
        pushLog(data.error ?? "Introuvable");
        return;
      }
      setPlayer(data.player ?? null);
      if (data.player) setTarget(data.player.username);
    } finally {
      setBusy(false);
    }
  }

  async function runAction(type: string, value?: string) {
    const t = target.trim();
    if (!t) {
      pushLog("Choisis un joueur.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          target: t,
          payload: value ?? payload,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok) {
        pushLog(data.error ?? `Échec ${type}`);
        return;
      }
      pushLog(`#${data.id} ${type} → pending`);
      // poll status briefly
      if (data.id) {
        for (let i = 0; i < 8; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const st = await fetch(`/api/admin/action?id=${data.id}`, { cache: "no-store" });
          const body = (await st.json()) as { status?: string; result?: string | null };
          if (body.status && body.status !== "pending") {
            pushLog(`#${data.id} ${body.status}${body.result ? ` — ${body.result}` : ""}`);
            break;
          }
        }
      }
      await lookup();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section className="border border-iron-line bg-iron p-5">
        <h2 className="font-display text-xl text-bone">En ligne</h2>
        <p className="mt-2 font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
          {online}
          {max != null ? ` / ${max}` : ""} joueurs
          {updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString("fr-FR")}` : ""}
        </p>
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {players.length === 0 ? (
            <li className="text-sm text-steel">Personne (ou JSON pas encore alimenté).</li>
          ) : (
            players.map((p) => (
              <li key={p.uuid}>
                <button
                  type="button"
                  className="nav-link font-tech text-xs uppercase tracking-[0.18em] text-steel-light hover:text-bone"
                  onClick={() => {
                    setTarget(p.name);
                    void lookup();
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))
          )}
        </ul>

        <h2 className="mt-8 font-display text-xl text-bone">Tickets Discord</h2>
        <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {tickets.length === 0 ? (
            <li className="text-sm text-steel">Aucun salon ticket visible.</li>
          ) : (
            tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 border-b border-iron-line/40 py-2">
                <span className="truncate font-tech text-[10px] uppercase tracking-[0.16em] text-steel-light">
                  {t.open ? "OPEN" : "CLOSED"} · {t.name}
                </span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-tech text-[10px] uppercase tracking-[0.18em] text-ember-glow hover:text-bone"
                >
                  Ouvrir
                </a>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="border border-iron-line bg-iron p-5">
        <h2 className="font-display text-xl text-bone">Joueur</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Pseudo ou UUID"
            className="min-w-0 flex-1 border border-iron-line bg-ash-deep px-4 py-3 text-sm text-bone placeholder:text-steel focus:border-ember focus:outline-none"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void lookup()}
            className="pressable border border-ember px-4 py-3 font-tech text-[11px] uppercase tracking-[0.2em] text-ember-glow hover:bg-ember hover:text-bone"
          >
            Charger
          </button>
        </div>

        {player && (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-steel-light sm:grid-cols-4">
            <div>
              <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Pseudo</dt>
              <dd className="text-bone">{player.username}</dd>
            </div>
            <div>
              <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Vies</dt>
              <dd className="text-bone">{player.lives}</dd>
            </div>
            <div>
              <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Cantox</dt>
              <dd className="text-bone">{Math.floor(player.balance)}</dd>
            </div>
            <div>
              <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Discord</dt>
              <dd className="truncate text-bone">{player.discordId ?? "—"}</dd>
            </div>
          </dl>
        )}

        <div className="mt-6">
          <label className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
            Payload (montant / vies / message / item)
          </label>
          <input
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="mt-2 w-full border border-iron-line bg-ash-deep px-4 py-3 text-sm text-bone focus:border-ember focus:outline-none"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["add_money", "Ajouter Cantox"],
              ["set_money", "Set Cantox"],
              ["add_lives", "Ajouter vies"],
              ["set_lives", "Set vies"],
              ["msg", "Msg MC"],
              ["discord_dm", "DM Discord"],
              ["ban", "Ban"],
              ["unban", "Unban"],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              disabled={busy}
              onClick={() => void runAction(type)}
              className="pressable border border-iron-line px-3 py-2 font-tech text-[10px] uppercase tracking-[0.18em] text-steel-light hover:border-ember hover:text-ember-glow disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ITEM_TYPES.map((item) => (
            <button
              key={item}
              type="button"
              disabled={busy}
              onClick={() => void runAction("give_item", item)}
              className="pressable border border-iron-line px-3 py-2 font-tech text-[10px] uppercase tracking-[0.16em] text-steel hover:text-bone disabled:opacity-40"
            >
              {item}
            </button>
          ))}
        </div>

        <h3 className="mt-8 font-tech text-[10px] uppercase tracking-[0.28em] text-ember-glow">Journal</h3>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto font-tech text-[10px] uppercase tracking-[0.14em] text-steel">
          {log.length === 0 ? <li>—</li> : log.map((line, i) => <li key={`${i}-${line}`}>{line}</li>)}
        </ul>
      </section>
    </div>
  );
}
