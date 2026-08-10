"use client";

import { useState } from "react";
import { Stamp } from "@/components/ui/stamp";

export const APPLY_MESSAGE_MAX = 500;

type SubmitStatus = "idle" | "sending" | "sent" | "error";

/**
 * Candidature à une faction — visible uniquement si le serveur a déjà validé
 * toutes les conditions (compte lié, sans faction, recrutement ouvert).
 * L'API revérifie tout côté serveur ; ici on ne fait que de l'UX.
 */
export function ApplyForm({ slug, factionName }: { slug: string; factionName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (status === "sending") return;
    if (!message.trim()) {
      setError("Écris quelques mots de motivation avant d'envoyer.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch(`/api/factions/${slug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Une erreur est survenue. Réessaie dans un instant.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Impossible de joindre le serveur. Vérifie ta connexion et réessaie.");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-4 border border-ember/60 bg-iron p-6 sm:p-8">
        <Stamp tone="gold">Transmise</Stamp>
        <p className="font-display text-xl font-semibold text-bone">
          Candidature déposée dans le registre.
        </p>
        <p className="max-w-xl text-sm leading-relaxed text-steel">
          Le leader de <span className="text-bone">{factionName}</span> la verra dans son
          panneau. S&apos;il t&apos;accepte, tu rejoins la faction en jeu dans la minute —
          connecte-toi pour le savoir.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-4 border border-iron-line bg-iron p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p className="max-w-xl text-sm leading-relaxed text-steel">
          Cette faction recrute. Présente-toi en quelques lignes — le leader te lit, et
          sa réponse s&apos;applique directement en jeu.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pressable shrink-0 border border-ember px-5 py-2.5 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone"
        >
          Postuler
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 border border-iron-line bg-iron p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
          Candidature — {factionName}
        </span>
        <p className="text-sm leading-relaxed text-steel">
          Quelques lignes suffisent : qui tu es, ce que tu sais faire, ce que tu viens
          chercher. Une seule candidature en attente à la fois.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="apply-message"
          className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel"
        >
          Message de motivation
        </label>
        <textarea
          id="apply-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={APPLY_MESSAGE_MAX}
          rows={5}
          placeholder="Ex. Je joue depuis l'ouverture, plutôt bon en défense de base…"
          className="w-full resize-y border border-iron-line bg-ash px-3.5 py-2.5 text-sm text-bone placeholder:text-steel/60 transition-colors focus:border-ember-glow focus:outline-none"
        />
        <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
          {message.trim().length}/{APPLY_MESSAGE_MAX}
        </span>
      </div>

      {error && (
        <p className="border border-ember/60 bg-ash px-4 py-3 text-sm text-ember-glow" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={status === "sending"}
          className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone disabled:cursor-not-allowed disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={status === "sending"}
          className="pressable bg-ember px-5 py-2.5 font-tech text-[11px] uppercase tracking-[0.22em] text-bone hover:bg-ember-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Envoi…" : "Envoyer ma candidature"}
        </button>
      </div>
    </div>
  );
}
