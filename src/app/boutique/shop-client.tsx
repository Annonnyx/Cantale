"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  RANK_COMPARISON,
  SHOP_ITEMS,
  SHOP_RANKS,
  SHOP_MAX_QUANTITY_PER_LINE,
  findShopEntry,
  formatPriceEur,
  type ShopEntry,
  type ShopItem,
  type ShopRank,
} from "@/lib/shop-catalog";
import { RARITY_LABELS, RARITY_STYLES } from "@/lib/items-data";

type CartLine = { id: string; quantity: number };

type ResolvedLine = { entry: ShopEntry; quantity: number };

const CART_STORAGE_KEY = "cantale_boutique_v1";

/** Rejette les ids inconnus et borne les quantités — le serveur revalide de toute façon. */
function sanitizeCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: CartLine[] = [];
  const seen = new Set<string>();
  for (const line of raw) {
    if (!line || typeof line !== "object") continue;
    const { id, quantity } = line as { id?: unknown; quantity?: unknown };
    if (typeof id !== "string" || seen.has(id)) continue;
    const entry = findShopEntry(id);
    if (!entry) continue;
    seen.add(id);
    if (entry.kind === "grade") {
      lines.push({ id, quantity: 1 });
      continue;
    }
    const qty =
      typeof quantity === "number" && Number.isInteger(quantity)
        ? Math.min(Math.max(quantity, 1), SHOP_MAX_QUANTITY_PER_LINE)
        : 1;
    lines.push({ id, quantity: qty });
  }
  return lines;
}

/* ─── Panier : store externe localStorage (useSyncExternalStore) ───────
 * Le snapshot serveur est toujours vide ; la lecture localStorage se fait
 * au montage côté client, sans effet ni mismatch d'hydratation. */

const EMPTY_CART: CartLine[] = [];
const cartListeners = new Set<() => void>();
let cartSnapshot: CartLine[] = EMPTY_CART;
let cartLoaded = false;

function getCartSnapshot(): CartLine[] {
  if (!cartLoaded) {
    cartLoaded = true;
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) cartSnapshot = sanitizeCart(JSON.parse(stored));
    } catch {
      // Stockage indisponible ou corrompu : panier vide.
    }
  }
  return cartSnapshot;
}

function getCartServerSnapshot(): CartLine[] {
  return EMPTY_CART;
}

function subscribeToCart(listener: () => void): () => void {
  cartListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== CART_STORAGE_KEY) return;
    try {
      cartSnapshot = event.newValue ? sanitizeCart(JSON.parse(event.newValue)) : EMPTY_CART;
    } catch {
      return;
    }
    cartListeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setCart(next: CartLine[]): void {
  cartSnapshot = next;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Stockage indisponible : le panier reste en mémoire.
  }
  cartListeners.forEach((notify) => notify());
}

function addToCart(item: ShopItem): void {
  const existing = cartSnapshot.find((line) => line.id === item.id);
  if (!existing) {
    setCart([...cartSnapshot, { id: item.id, quantity: 1 }]);
    return;
  }
  setCart(
    cartSnapshot.map((line) =>
      line.id === item.id
        ? { ...line, quantity: Math.min(line.quantity + 1, SHOP_MAX_QUANTITY_PER_LINE) }
        : line,
    ),
  );
}

function toggleRankInCart(rank: ShopRank): void {
  if (cartSnapshot.some((line) => line.id === rank.id)) {
    setCart(cartSnapshot.filter((line) => line.id !== rank.id));
  } else {
    setCart([...cartSnapshot, { id: rank.id, quantity: 1 }]);
  }
}

function setCartQuantity(id: string, quantity: number): void {
  if (quantity <= 0) {
    setCart(cartSnapshot.filter((line) => line.id !== id));
    return;
  }
  setCart(
    cartSnapshot.map((line) =>
      line.id === id
        ? { ...line, quantity: Math.min(quantity, SHOP_MAX_QUANTITY_PER_LINE) }
        : line,
    ),
  );
}

/* ─── Présentation ───────────────────────────────────────────────────── */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
      {children}
    </span>
  );
}

function SectionTitle({ kicker, title, intro }: { kicker: string; title: string; intro?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Kicker>{kicker}</Kicker>
      <h2 className="font-display text-2xl font-semibold text-bone sm:text-3xl">{title}</h2>
      {intro ? <p className="max-w-2xl text-sm leading-relaxed text-steel">{intro}</p> : null}
    </div>
  );
}

const BUTTON_PRIMARY =
  "pressable inline-block border border-ember px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone disabled:cursor-not-allowed disabled:opacity-50";
const BUTTON_SECONDARY =
  "pressable inline-block border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone disabled:cursor-not-allowed disabled:opacity-50";

function RankCard({
  rank,
  inCart,
}: {
  rank: ShopRank;
  inCart: boolean;
}) {
  return (
    <article
      className={`card-soft relative flex flex-col gap-6 border bg-iron p-6 sm:p-8 ${
        rank.featured ? "border-gold/60" : "border-iron-line"
      }`}
    >
      {rank.featured && (
        <span className="absolute -top-3 left-6 border border-gold bg-ash px-2.5 py-1 font-tech text-[9px] uppercase tracking-[0.24em] text-gold">
          Meilleure offre
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <span
          className={`font-tech text-[10px] uppercase tracking-[0.24em] ${
            rank.featured ? "text-gold" : "text-steel"
          }`}
        >
          Rang mensuel — {rank.inGameName} en jeu
        </span>
        <h3 className="font-display text-3xl font-semibold text-bone">{rank.name}</h3>
        <p className="text-sm leading-relaxed text-steel">{rank.tagline}</p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`font-display text-4xl font-semibold ${rank.featured ? "text-gold" : "text-bone"}`}>
          {formatPriceEur(rank.priceEur)}
        </span>
        <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
          / mois — renouvelable
        </span>
      </div>

      <ul className="flex flex-col gap-3 border-t border-iron-line/60 pt-5">
        {rank.perks.map((perk) => (
          <li key={perk.label} className="flex flex-col gap-0.5">
            <span className="font-tech text-[9px] uppercase tracking-[0.22em] text-steel">
              {perk.label}
            </span>
            <span className="text-sm leading-relaxed text-bone">{perk.value}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => toggleRankInCart(rank)}
        aria-pressed={inCart}
        className={`mt-auto ${inCart ? BUTTON_SECONDARY : BUTTON_PRIMARY}`}
      >
        {inCart ? "Retirer du panier" : "Ajouter au panier"}
      </button>
    </article>
  );
}

function ComparisonTable() {
  return (
    <div className="overflow-x-auto border border-iron-line bg-iron">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr className="border-b border-iron-line">
            <th className="px-4 py-3 text-left font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Avantage
            </th>
            {SHOP_RANKS.map((rank) => (
              <th
                key={rank.id}
                className={`px-4 py-3 text-center font-tech text-[10px] uppercase tracking-[0.24em] ${
                  rank.featured ? "text-gold" : "text-bone"
                }`}
              >
                {rank.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RANK_COMPARISON.map((row) => (
            <tr key={row.label} className="border-b border-iron-line/50 last:border-b-0">
              <th className="px-4 py-3 text-left font-sans text-sm font-normal text-bone">
                {row.label}
              </th>
              {row.values.map((value, index) => (
                <td
                  key={SHOP_RANKS[index].id}
                  className={`px-4 py-3 text-center text-sm ${
                    SHOP_RANKS[index].featured ? "text-gold" : "text-steel"
                  }`}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ItemCard({ item }: { item: ShopItem }) {
  const styles = RARITY_STYLES[item.rarity];
  return (
    <article className={`card-soft flex flex-col gap-4 border bg-iron p-5 ${styles.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg font-semibold text-bone">{item.name}</h3>
          <span className={`font-tech text-[9px] uppercase tracking-[0.22em] ${styles.text}`}>
            {item.kind === "clef" ? `Clé — ${RARITY_LABELS[item.rarity]}` : RARITY_LABELS[item.rarity]}
          </span>
        </div>
        {item.featured && (
          <span className="border border-gold/60 px-2 py-1 font-tech text-[8px] uppercase tracking-[0.2em] text-gold">
            Meilleur prix
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-steel">{item.tagline}</p>
      <div className="mt-auto flex flex-col gap-3 border-t border-iron-line/60 pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-display text-2xl font-semibold text-gold">
            {formatPriceEur(item.priceEur)}
          </span>
          <span className="flex items-center gap-2">
            {item.unitLabel && (
              <span className="font-tech text-[9px] uppercase tracking-[0.18em] text-steel">
                {item.unitLabel}
              </span>
            )}
            {item.savingLabel && (
              <span className="border border-ember/50 px-1.5 py-0.5 font-tech text-[9px] uppercase tracking-[0.18em] text-ember-glow">
                {item.savingLabel}
              </span>
            )}
          </span>
        </div>
        <button type="button" onClick={() => addToCart(item)} className={BUTTON_PRIMARY}>
          Ajouter au panier
        </button>
      </div>
    </article>
  );
}

type CheckoutState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string; showLoginLink?: boolean }
  | { status: "info"; message: string };

export function BoutiqueShop() {
  const lines = useSyncExternalStore(subscribeToCart, getCartSnapshot, getCartServerSnapshot);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState>({ status: "idle" });

  useEffect(() => {
    if (!cartOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cartOpen]);

  const resolved = useMemo<ResolvedLine[]>(
    () =>
      lines
        .map((line) => ({ entry: findShopEntry(line.id), quantity: line.quantity }))
        .filter((line): line is ResolvedLine => line.entry !== undefined),
    [lines],
  );

  const totalEur = useMemo(
    () =>
      Math.round(
        resolved.reduce((sum, line) => sum + line.entry.priceEur * line.quantity, 0) * 100,
      ) / 100,
    [resolved],
  );

  const articleCount = useMemo(
    () => resolved.reduce((sum, line) => sum + line.quantity, 0),
    [resolved],
  );

  async function submitCheckout() {
    if (resolved.length === 0) return;
    setCheckout({ status: "submitting" });
    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: resolved.map((line) => ({ id: line.entry.id, quantity: line.quantity })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 401) {
        setCheckout({
          status: "error",
          message: data.error ?? "Connecte-toi avec Discord et lie ton compte Minecraft.",
          showLoginLink: true,
        });
      } else if (response.status === 503) {
        setCheckout({
          status: "error",
          message:
            data.error ??
            "Boutique fermée — ouverture prévue pour la S1 après changement d'hébergeur.",
        });
      } else if (response.status === 501) {
        setCheckout({
          status: "info",
          message: `Panier validé côté serveur — total ${formatPriceEur(totalEur)}. ${
            data.error ?? "Paiement en cours d'intégration"
          } : aucune somme n'a été prélevée.`,
        });
      } else if (!response.ok) {
        setCheckout({
          status: "error",
          message: data.error ?? "La commande a échoué. Réessaie.",
        });
      } else {
        setCheckout({ status: "info", message: "Commande transmise. Merci." });
        setCart(EMPTY_CART);
      }
    } catch {
      setCheckout({
        status: "error",
        message: "Impossible de joindre le serveur. Vérifie ta connexion.",
      });
    }
  }

  const vies = SHOP_ITEMS.filter((item) => item.kind === "vie");
  const clefs = SHOP_ITEMS.filter((item) => item.kind === "clef");

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-32 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <Kicker>Registre — Boutique</Kicker>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          La boutique
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Soutiens le serveur et repars avec des avantages réels : rangs mensuels, vies
          hardcore et clés de caisse. Chaque prix est re-vérifié côté serveur à la
          commande.
        </p>
      </header>

      <section aria-labelledby="shop-rangs" className="flex flex-col gap-8 border-t border-iron-line/60 py-14">
        <SectionTitle
          kicker="01 — Rangs"
          title="Trois rangs, trois manières de régner"
          intro="Avantages actifs tant que le rang est actif. Vies et Cantox sont versés automatiquement à ta connexion ; les coffres, homes et ventes s'appliquent dès l'attribution du grade en jeu."
        />
        <div id="shop-rangs" className="reveal reveal-stagger grid gap-6 lg:grid-cols-3">
          {SHOP_RANKS.map((rank) => (
            <RankCard
              key={rank.id}
              rank={rank}
              inCart={lines.some((line) => line.id === rank.id)}
            />
          ))}
        </div>
        <ComparisonTable />
      </section>

      <section aria-labelledby="shop-vies" className="flex flex-col gap-8 border-t border-iron-line/60 py-14">
        <SectionTitle
          kicker="02 — Vies"
          title="Vies hardcore"
          intro="Trois morts et c'est le bannissement : la Vie est le bien le plus précieux de CANTALE. Consommable au clic-droit, stockable sans limite — et moins chère en pack."
        />
        <div id="shop-vies" className="reveal reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vies.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section aria-labelledby="shop-clefs" className="flex flex-col gap-8 border-t border-iron-line/60 py-14">
        <SectionTitle
          kicker="03 — Clés de caisse"
          title="Les quatre paliers de butin"
          intro="Chaque clé ouvre sa caisse au spawn : coffre du Trésor Public, autel de la Médaille, fontaine de la Pièce, audience du Ticket. La bordure indique le palier, comme dans le registre des items. Le Cadeau du Roi, lui, ne s'achète pas : il se gagne en votant."
        />
        <div id="shop-clefs" className="reveal reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {clefs.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {resolved.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-iron-line bg-iron/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
              Panier — {articleCount} article{articleCount > 1 ? "s" : ""} ·{" "}
              <span className="text-gold">{formatPriceEur(totalEur)}</span>
            </span>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className={BUTTON_PRIMARY}
            >
              Voir le panier
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Panier">
          <button
            type="button"
            aria-label="Fermer le panier"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ash/80"
          />
          <div className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-l border-iron-line bg-iron p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-bone">Panier</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className={BUTTON_SECONDARY}
              >
                Fermer
              </button>
            </div>

            {resolved.length === 0 ? (
              <p className="text-sm leading-relaxed text-steel">
                Le panier est vide. Ajoute un rang, des vies ou des clés depuis la boutique.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-4">
                  {resolved.map((line) => (
                    <li
                      key={line.entry.id}
                      className="flex flex-col gap-3 border border-iron-line/70 bg-ash-deep p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-display text-base font-semibold text-bone">
                            {line.entry.name}
                          </span>
                          <span className="font-tech text-[9px] uppercase tracking-[0.2em] text-steel">
                            {line.entry.kind === "grade"
                              ? "Rang mensuel"
                              : `${formatPriceEur(line.entry.priceEur)} / unité`}
                          </span>
                        </div>
                        <span className="font-display text-lg font-semibold text-gold">
                          {formatPriceEur(line.entry.priceEur * line.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        {line.entry.kind === "grade" ? (
                          <span className="font-tech text-[9px] uppercase tracking-[0.2em] text-steel">
                            Quantité fixe — abonnement mensuel
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Retirer une unité de ${line.entry.name}`}
                              onClick={() => setCartQuantity(line.entry.id, line.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center border border-iron-line font-tech text-xs text-steel transition-colors hover:border-bone hover:text-bone"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center font-tech text-xs text-bone">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Ajouter une unité de ${line.entry.name}`}
                              onClick={() => setCartQuantity(line.entry.id, line.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center border border-iron-line font-tech text-xs text-steel transition-colors hover:border-bone hover:text-bone"
                            >
                              +
                            </button>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCartQuantity(line.entry.id, 0)}
                          className="font-tech text-[9px] uppercase tracking-[0.2em] text-steel transition-colors hover:text-bone"
                        >
                          Retirer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-iron-line/60 pt-4">
                  <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                    Total
                  </span>
                  <span className="font-display text-2xl font-semibold text-gold">
                    {formatPriceEur(totalEur)}
                  </span>
                </div>

                {checkout.status === "error" && (
                  <div
                    role="alert"
                    className="flex flex-col gap-3 border border-ember/60 bg-ash-deep px-4 py-3"
                  >
                    <p className="text-sm text-ember-glow">{checkout.message}</p>
                    {checkout.showLoginLink && (
                      <Link
                        href="/connexion"
                        className="self-start font-tech text-[10px] uppercase tracking-[0.22em] text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
                      >
                        Aller à la connexion
                      </Link>
                    )}
                  </div>
                )}
                {checkout.status === "info" && (
                  <p role="status" className="border border-gold/60 bg-ash-deep px-4 py-3 text-sm text-gold">
                    {checkout.message}
                  </p>
                )}

                <button
                  type="button"
                  onClick={submitCheckout}
                  disabled={checkout.status === "submitting"}
                  className={BUTTON_PRIMARY}
                >
                  {checkout.status === "submitting" ? "Validation…" : "Commander"}
                </button>
                <p className="font-tech text-[9px] uppercase leading-relaxed tracking-[0.18em] text-steel">
                  Le panier est re-validé et re-tarifé côté serveur. Compte Discord lié à
                  Minecraft requis. Le paiement est en cours d&apos;intégration : aucune
                  somme n&apos;est prélevée.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
