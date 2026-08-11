"use client";

import { useState } from "react";

type SlotItem = {
  slot: number;
  material: string;
  amount: number;
  name?: string;
  container?: "shulker" | "bundle" | string;
  contents?: SlotItem[];
};

type InspectPayload = {
  uuid: string;
  username: string;
  online: boolean;
  captured_at: string;
  inventory?: {
    note?: string;
    storage?: SlotItem[];
    armor?: SlotItem[];
    offhand?: SlotItem | Record<string, never>;
  };
  ender_chest?: {
    source: string;
    note?: string;
    items?: SlotItem[];
  };
  private_chests?: Record<
    string,
    { accessible: boolean; size?: number; items?: SlotItem[] }
  >;
  effects?: { type: string; amplifier: number; duration_ticks: number }[];
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

const MUTATION_TYPES = new Set([
  "clear_container",
  "remove_slot",
  "clear_shulker",
  "give_effect",
  "clear_effect",
]);

function formatItem(item: SlotItem) {
  const label = item.name?.trim() || item.material;
  return `#${item.slot} ${label} ×${item.amount}`;
}

function ItemList({
  items,
  empty,
  container,
  busy,
  onRemove,
  onClearShulker,
}: {
  items?: SlotItem[];
  empty: string;
  container: string;
  busy: boolean;
  onRemove: (payload: string) => void;
  onClearShulker: (payload: string) => void;
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-steel">{empty}</p>;
  }
  return (
    <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
      {items.map((it) => {
        const path = `${container}:${it.slot}`;
        const hasInner = Boolean(it.contents && it.contents.length > 0);
        return (
          <li key={`${path}-${it.material}-${it.amount}`} className="border-b border-iron-line/30 pb-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-tech text-[10px] uppercase tracking-[0.12em] text-steel-light">
                {formatItem(it)}
                {it.container ? ` · ${it.container}` : ""}
              </span>
              <div className="flex shrink-0 flex-wrap gap-1">
                {it.container === "shulker" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onClearShulker(path)}
                    className="font-tech text-[9px] uppercase tracking-[0.14em] text-steel hover:text-ember-glow disabled:opacity-40"
                  >
                    Vider
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(path)}
                  className="font-tech text-[9px] uppercase tracking-[0.14em] text-ember-glow hover:text-bone disabled:opacity-40"
                >
                  Suppr
                </button>
              </div>
            </div>
            {hasInner && (
              <ul className="mt-1 space-y-1 border-l border-iron-line/50 pl-3">
                {it.contents!.map((inner) => (
                  <li
                    key={`${path}:${inner.slot}-${inner.material}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-tech text-[9px] uppercase tracking-[0.12em] text-steel">
                      {formatItem(inner)}
                    </span>
                    {it.container === "shulker" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRemove(`${path}:${inner.slot}`)}
                        className="font-tech text-[9px] uppercase tracking-[0.14em] text-ember-glow hover:text-bone disabled:opacity-40"
                      >
                        Suppr
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  uuid: string;
  username: string;
  initialLives: number;
  initialBalance: number;
  discordId: string | null;
};

/**
 * Panneau Direction : mutations + inspect inventaire / EC / PC / effets
 * via `web_admin_actions` + WebAdminBridge (même pont que /admin).
 */
export function AdminPlayerTools({
  uuid,
  username,
  initialLives,
  initialBalance,
  discordId,
}: Props) {
  const [lives, setLives] = useState(initialLives);
  const [balance, setBalance] = useState(initialBalance);
  const [payload, setPayload] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [inspect, setInspect] = useState<InspectPayload | null>(null);
  const [effectType, setEffectType] = useState("speed");
  const [effectAmp, setEffectAmp] = useState("0");
  const [effectSec, setEffectSec] = useState("60");

  const target = username || uuid;
  const pushLog = (line: string) => setLog((prev) => [line, ...prev].slice(0, 40));

  async function reloadProfile() {
    try {
      const res = await fetch(`/api/admin/player?q=${encodeURIComponent(uuid)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        player?: { lives: number; balance: number };
      };
      if (data.player) {
        setLives(data.player.lives);
        setBalance(data.player.balance);
      }
    } catch {
      /* ignore */
    }
  }

  async function loadSnapshotFromAction(actionId: number) {
    const st = await fetch(`/api/admin/action?id=${actionId}`, { cache: "no-store" });
    const body = (await st.json()) as { status?: string; result?: string | null };
    if (body.status !== "done" || !body.result?.startsWith("snapshot:")) return false;
    const snapId = Number.parseInt(body.result.slice("snapshot:".length), 10);
    if (!Number.isFinite(snapId)) return false;
    const snapRes = await fetch(`/api/admin/snapshot?id=${snapId}`, { cache: "no-store" });
    const snapBody = (await snapRes.json()) as { payload?: InspectPayload; error?: string };
    if (!snapRes.ok || !snapBody.payload) {
      pushLog(snapBody.error ?? "Snapshot illisible");
      return false;
    }
    setInspect(snapBody.payload);
    pushLog(`Snapshot #${snapId} chargé`);
    return true;
  }

  async function runAction(type: string, value?: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          target,
          payload: value ?? payload,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok) {
        pushLog(data.error ?? `Échec ${type}`);
        return;
      }
      pushLog(`#${data.id} ${type} → pending`);
      let doneOk = false;
      if (data.id) {
        const maxPoll = type === "inspect_player" || MUTATION_TYPES.has(type) ? 12 : 8;
        for (let i = 0; i < maxPoll; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const st = await fetch(`/api/admin/action?id=${data.id}`, { cache: "no-store" });
          const body = (await st.json()) as { status?: string; result?: string | null };
          if (body.status && body.status !== "pending") {
            pushLog(`#${data.id} ${body.status}${body.result ? ` — ${body.result}` : ""}`);
            doneOk = body.status === "done";
            if (type === "inspect_player" && doneOk) {
              await loadSnapshotFromAction(data.id);
            }
            break;
          }
        }
      }

      if (doneOk && MUTATION_TYPES.has(type)) {
        pushLog("Re-inspection…");
        const insp = await fetch("/api/admin/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "inspect_player", target, payload: "" }),
        });
        const inspData = (await insp.json()) as { id?: number; error?: string };
        if (insp.ok && inspData.id) {
          for (let i = 0; i < 12; i++) {
            await new Promise((r) => setTimeout(r, 1500));
            const st = await fetch(`/api/admin/action?id=${inspData.id}`, { cache: "no-store" });
            const body = (await st.json()) as { status?: string };
            if (body.status && body.status !== "pending") {
              if (body.status === "done") await loadSnapshotFromAction(inspData.id);
              break;
            }
          }
        }
      }

      if (type !== "inspect_player" && !MUTATION_TYPES.has(type)) {
        await reloadProfile();
      }
    } finally {
      setBusy(false);
    }
  }

  const offhandItems: SlotItem[] =
    inspect?.inventory?.offhand &&
    "material" in inspect.inventory.offhand &&
    typeof inspect.inventory.offhand.material === "string"
      ? [inspect.inventory.offhand as SlotItem]
      : [];

  return (
    <section className="mt-10 space-y-6 border border-ember/50 bg-iron p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl text-bone">Outils Direction</h2>
        <p className="mt-2 font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
          Visible admin uniquement · file plugin ~2 s · UUID {uuid}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-steel-light sm:grid-cols-4">
          <div>
            <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Vies</dt>
            <dd className="text-bone">{lives}</dd>
          </div>
          <div>
            <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Cantox</dt>
            <dd className="text-bone">{Math.floor(balance)}</dd>
          </div>
          <div>
            <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Discord</dt>
            <dd className="truncate text-bone">{discordId ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">Pseudo</dt>
            <dd className="truncate text-bone">{username}</dd>
          </div>
        </dl>
      </div>

      <div>
        <label className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
          Payload (montant / vies / message / item)
        </label>
        <input
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="mt-2 w-full border border-iron-line bg-ash-deep px-4 py-3 text-sm text-bone focus:border-ember focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void runAction("inspect_player")}
          className="pressable border border-ember px-3 py-2 font-tech text-[10px] uppercase tracking-[0.18em] text-ember-glow hover:bg-ember hover:text-bone disabled:opacity-40"
        >
          Inspecter / rafraîchir
        </button>
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

      <div className="flex flex-wrap gap-2">
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

      {inspect && (
        <div className="space-y-6 border-t border-iron-line pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-lg text-bone">Inspection & édition</h3>
              <p className="mt-1 font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
                {inspect.username} · {inspect.online ? "en ligne" : "hors ligne"} ·{" "}
                {new Date(inspect.captured_at).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Clear tout"],
                  ["inventory", "Clear inv"],
                  ["ender", "Clear EC"],
                  ["pc_all", "Clear PC"],
                  ["effects", "Clear effets"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={busy}
                  onClick={() => void runAction("clear_container", value)}
                  className="pressable border border-iron-line px-3 py-2 font-tech text-[10px] uppercase tracking-[0.16em] text-steel-light hover:border-ember hover:text-ember-glow disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-tech text-[10px] uppercase tracking-[0.22em] text-ember-glow">
                Inventaire
              </h4>
              {!inspect.inventory?.note && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runAction("clear_container", "inventory")}
                  className="font-tech text-[9px] uppercase tracking-[0.16em] text-steel hover:text-ember-glow disabled:opacity-40"
                >
                  Vider inventaire
                </button>
              )}
            </div>
            {inspect.inventory?.note ? (
              <p className="mt-2 text-sm text-steel">{inspect.inventory.note}</p>
            ) : (
              <div className="mt-2 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs text-steel">Stockage</p>
                  <ItemList
                    items={inspect.inventory?.storage}
                    empty="Vide"
                    container="storage"
                    busy={busy}
                    onRemove={(p) => void runAction("remove_slot", p)}
                    onClearShulker={(p) => void runAction("clear_shulker", p)}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-steel">Armure</p>
                  <ItemList
                    items={inspect.inventory?.armor}
                    empty="Vide"
                    container="armor"
                    busy={busy}
                    onRemove={(p) => void runAction("remove_slot", p)}
                    onClearShulker={(p) => void runAction("clear_shulker", p)}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-steel">Offhand</p>
                  <ItemList
                    items={offhandItems}
                    empty="Vide"
                    container="offhand"
                    busy={busy}
                    onRemove={(p) => void runAction("remove_slot", p)}
                    onClearShulker={(p) => void runAction("clear_shulker", p)}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-tech text-[10px] uppercase tracking-[0.22em] text-ember-glow">
                Ender chest
              </h4>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("clear_container", "ender")}
                className="font-tech text-[9px] uppercase tracking-[0.16em] text-steel hover:text-ember-glow disabled:opacity-40"
              >
                Vider EC
              </button>
            </div>
            <p className="mt-1 text-xs text-steel">
              Source : {inspect.ender_chest?.source ?? "—"}
              {inspect.ender_chest?.note ? ` — ${inspect.ender_chest.note}` : ""}
            </p>
            <div className="mt-2">
              <ItemList
                items={inspect.ender_chest?.items}
                empty="Vide ou indisponible"
                container="ender"
                busy={busy}
                onRemove={(p) => void runAction("remove_slot", p)}
                onClearShulker={(p) => void runAction("clear_shulker", p)}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-tech text-[10px] uppercase tracking-[0.22em] text-ember-glow">
                Coffres privés
              </h4>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("clear_container", "pc_all")}
                className="font-tech text-[9px] uppercase tracking-[0.16em] text-steel hover:text-ember-glow disabled:opacity-40"
              >
                Vider tous les PC
              </button>
            </div>
            <div className="mt-2 grid gap-4 sm:grid-cols-3">
              {(["pc1", "pc2", "pc3"] as const).map((key) => {
                const chest = inspect.private_chests?.[key];
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs text-steel">
                        {key.toUpperCase()}
                        {chest?.accessible === false ? " (rang insuffisant)" : ""}
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void runAction("clear_container", key)}
                        className="font-tech text-[9px] uppercase tracking-[0.14em] text-steel hover:text-ember-glow disabled:opacity-40"
                      >
                        Vider
                      </button>
                    </div>
                    <ItemList
                      items={chest?.items}
                      empty="Vide"
                      container={key}
                      busy={busy}
                      onRemove={(p) => void runAction("remove_slot", p)}
                      onClearShulker={(p) => void runAction("clear_shulker", p)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-tech text-[10px] uppercase tracking-[0.22em] text-ember-glow">
              Effets actifs
            </h4>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-xs text-steel">
                Type
                <input
                  value={effectType}
                  onChange={(e) => setEffectType(e.target.value)}
                  placeholder="speed"
                  className="mt-1 block w-36 border border-iron-line bg-ash-deep px-2 py-2 text-sm text-bone"
                />
              </label>
              <label className="text-xs text-steel">
                Ampli
                <input
                  value={effectAmp}
                  onChange={(e) => setEffectAmp(e.target.value)}
                  className="mt-1 block w-16 border border-iron-line bg-ash-deep px-2 py-2 text-sm text-bone"
                />
              </label>
              <label className="text-xs text-steel">
                Secondes
                <input
                  value={effectSec}
                  onChange={(e) => setEffectSec(e.target.value)}
                  className="mt-1 block w-20 border border-iron-line bg-ash-deep px-2 py-2 text-sm text-bone"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void runAction("give_effect", `${effectType}:${effectAmp}:${effectSec}`)
                }
                className="pressable border border-ember px-3 py-2 font-tech text-[10px] uppercase tracking-[0.16em] text-ember-glow hover:bg-ember hover:text-bone disabled:opacity-40"
              >
                Donner effet
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("clear_effect", "all")}
                className="pressable border border-iron-line px-3 py-2 font-tech text-[10px] uppercase tracking-[0.16em] text-steel-light hover:text-ember-glow disabled:opacity-40"
              >
                Clear tous effets
              </button>
            </div>
            {!inspect.effects || inspect.effects.length === 0 ? (
              <p className="mt-3 text-sm text-steel">
                {inspect.online ? "Aucun effet" : "Disponibles uniquement en ligne"}
              </p>
            ) : (
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto">
                {inspect.effects.map((e) => (
                  <li
                    key={`${e.type}-${e.amplifier}`}
                    className="flex items-center justify-between gap-2 font-tech text-[10px] uppercase tracking-[0.12em] text-steel-light"
                  >
                    <span>
                      {e.type} {e.amplifier + 1} ·{" "}
                      {Math.max(0, Math.round(e.duration_ticks / 20))}s
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runAction("clear_effect", e.type)}
                      className="text-ember-glow hover:text-bone disabled:opacity-40"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-tech text-[10px] uppercase tracking-[0.28em] text-ember-glow">Journal</h3>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto font-tech text-[10px] uppercase tracking-[0.14em] text-steel">
          {log.length === 0 ? <li>—</li> : log.map((line, i) => <li key={`${i}-${line}`}>{line}</li>)}
        </ul>
      </div>
    </section>
  );
}
