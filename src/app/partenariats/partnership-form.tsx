"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Stamp } from "@/components/ui/stamp";
import {
  ALLIANCE_TYPES,
  DISCORD_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  NAME_MAX_LENGTH,
  PRESENCE_MAX_LENGTH,
  getAllianceTypeById,
  type AllianceTypeId,
} from "./alliance-types";

/**
 * Formulaire de contact partenariats (single form).
 * Anti-spam : honeypot toujours actif ; Turnstile chargé seulement si
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY est défini au build.
 */

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const inputClasses =
  "w-full border border-iron-line bg-ash px-3.5 py-2.5 text-sm text-bone placeholder:text-steel/60 transition-colors focus:border-ember-glow focus:outline-none";

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-baseline gap-2 font-tech text-[10px] uppercase tracking-[0.24em] text-steel"
    >
      {label}
      {required && <span className="text-ember-glow">requis</span>}
    </label>
  );
}

export function PartnershipForm({ discordName }: { discordName: string | null }) {
  const [allianceType, setAllianceType] = useState<AllianceTypeId | "">("");
  const [name, setName] = useState("");
  const [discord, setDiscord] = useState(discordName ?? "");
  const [presence, setPresence] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [ticketChannel, setTicketChannel] = useState<string | null>(null);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);

  const selectedType = useMemo(
    () => (allianceType ? getAllianceTypeById(allianceType) : undefined),
    [allianceType],
  );

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !turnstileContainerRef.current || !window.turnstile) return;
      if (turnstileWidgetRef.current !== null) return;
      turnstileWidgetRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        "error-callback": () => setTurnstileToken(null),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (turnstileWidgetRef.current !== null && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current);
        turnstileWidgetRef.current = null;
      }
    };
  }, []);

  function validateClient(): string | null {
    if (!selectedType) return "Choisis un type d'alliance.";
    if (name.trim().length < 2) return "Indique ton nom ou pseudo (au moins 2 caractères).";
    if (discord.trim().length < 2) return "Indique ton Discord (tag ou ID) — requis.";
    if (selectedType.presenceRequired && !presence.trim()) {
      return "Indique ton site, réseau ou serveur — requis pour ce type d'alliance.";
    }
    if (message.trim().length < MESSAGE_MIN_LENGTH) {
      return `Ton message doit faire au moins ${MESSAGE_MIN_LENGTH} caractères — présente ton projet clairement.`;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      return "Vérification anti-robot en cours — patiente un instant.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateClient();
    setFormError(error);
    if (error || status === "submitting") return;

    setStatus("submitting");
    setFormError(null);
    try {
      const res = await fetch("/api/partenariats", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allianceType,
          name: name.trim(),
          discord: discord.trim(),
          presence: presence.trim(),
          message: message.trim(),
          website: honeypot,
          turnstileToken: turnstileToken ?? "",
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; channel?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setStatus("error");
        setFormError(data?.error ?? "Une erreur est survenue. Réessaie dans un instant.");
        return;
      }
      setTicketChannel(data.channel ?? null);
      setStatus("success");
    } catch {
      setStatus("error");
      setFormError("Impossible de joindre le serveur. Vérifie ta connexion et réessaie.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-6 border border-ember/60 bg-iron p-8 sm:p-12">
        <Stamp tone="gold">Enregistrée</Stamp>
        <h3 className="font-display text-2xl font-semibold leading-tight text-bone sm:text-3xl">
          Ta demande est enregistrée — un ticket Discord a été ouvert.
        </h3>
        <p className="max-w-2xl text-sm leading-relaxed text-steel">
          Ta proposition
          {selectedType ? (
            <>
              {" "}
              pour <span className="text-bone">{selectedType.label}</span>
            </>
          ) : null}{" "}
          a été déposée dans le registre. Un salon privé
          {ticketChannel ? (
            <>
              {" "}
              <code className="border border-iron-line bg-ash-deep px-1.5 py-0.5 font-tech text-xs text-ember-glow">
                {ticketChannel}
              </code>
            </>
          ) : null}{" "}
          vient d&apos;être créé sur le Discord de Cantale : la direction te répondra
          directement là-bas.
          {discordName
            ? " Ton compte Discord y a déjà accès — surveille tes salons."
            : " Rejoins le Discord si ce n'est pas déjà fait : c'est là que tout se traite."}
        </p>
        <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
          Réponse de la direction — Fondateur / Direction
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-7 border border-iron-line bg-iron p-6 sm:p-10"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="alliance-type" label="Type d'alliance" required />
        <select
          id="alliance-type"
          value={allianceType}
          onChange={(event) => setAllianceType(event.target.value as AllianceTypeId | "")}
          className={inputClasses}
        >
          <option value="" disabled>
            Choisir une formule…
          </option>
          {ALLIANCE_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.num} — {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="partner-name" label="Nom / pseudo" required />
          <input
            id="partner-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex. Onyx, FactionNord…"
            maxLength={NAME_MAX_LENGTH}
            className={inputClasses}
            autoComplete="nickname"
          />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="partner-discord" label="Discord (tag ou ID)" required />
          <input
            id="partner-discord"
            type="text"
            value={discord}
            onChange={(event) => setDiscord(event.target.value)}
            placeholder="Ex. onyx ou 123456789012345678"
            maxLength={DISCORD_MAX_LENGTH}
            className={inputClasses}
            autoComplete="off"
          />
          <span className="text-xs text-steel">
            {discordName
              ? "Pré-rempli depuis ta session — corrige si tu préfères un autre tag."
              : "C'est par là que la direction te recontacte."}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          htmlFor="partner-presence"
          label="Site / réseau / serveur"
          required={selectedType?.presenceRequired}
        />
        <input
          id="partner-presence"
          type="text"
          value={presence}
          onChange={(event) => setPresence(event.target.value)}
          placeholder="URL, @compte, invite Discord, nom du serveur…"
          maxLength={PRESENCE_MAX_LENGTH}
          className={inputClasses}
        />
        <span className="text-xs text-steel">
          {selectedType?.presenceRequired
            ? "Requis pour les formules communauté et créateur — un lien ou un nom clair suffit."
            : "Optionnel selon la formule — utile dès que tu as un lien à montrer."}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="partner-message" label="Message / pitch" required />
        <textarea
          id="partner-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Qui tu es, ton audience, ce que tu proposes, et ce que tu attends de Cantale."
          maxLength={MESSAGE_MAX_LENGTH}
          rows={6}
          className={`${inputClasses} resize-y`}
        />
        <span
          className={`font-tech text-[10px] uppercase tracking-[0.2em] ${
            message.trim().length < MESSAGE_MIN_LENGTH ? "text-steel" : "text-ember-glow"
          }`}
        >
          {message.trim().length}/{MESSAGE_MAX_LENGTH} — minimum {MESSAGE_MIN_LENGTH} caractères
        </span>
      </div>

      {/* Honeypot : invisible pour les humains */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="partenariats-website">Ne pas remplir</label>
        <input
          id="partenariats-website"
          type="text"
          name="website"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {TURNSTILE_SITE_KEY && <div ref={turnstileContainerRef} className="min-h-[65px]" />}

      {formError && (
        <p className="border border-ember/60 bg-ash px-4 py-3 text-sm text-ember-glow" role="alert">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-iron-line/60 pt-6">
        <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel/60">
          Ouvre un ticket privé avec la direction
        </span>
        <button
          type="submit"
          disabled={status === "submitting" || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
          className="pressable bg-ember px-5 py-2.5 font-tech text-[11px] uppercase tracking-[0.22em] text-bone hover:bg-ember-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? "Envoi…" : "Envoyer ma demande"}
        </button>
      </div>
    </form>
  );
}
