"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stamp } from "@/components/ui/stamp";
import {
  EXPERIENCE_LEVELS,
  LINK_MAX_LENGTH,
  MINECRAFT_PSEUDO_PATTERN,
  MOTIVATION_MAX_LENGTH,
  MOTIVATION_MIN_LENGTH,
  RECRUITMENT_ROLES,
  type RoleDefinition,
  type RoleField,
} from "./roles";

/**
 * Formulaire de candidature multi-étapes.
 * Anti-spam : honeypot toujours actif ; le widget Cloudflare Turnstile n'est
 * chargé que si NEXT_PUBLIC_TURNSTILE_SITE_KEY est défini au build.
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

const STEPS = [
  { id: 0, label: "Le poste" },
  { id: 1, label: "Ton profil" },
  { id: 2, label: "Tes infos" },
  { id: 3, label: "Envoi" },
] as const;

const LINK_FIELDS = [
  { id: "discord", label: "Pseudo Discord", placeholder: "Ex. onyx ou onyx.1234" },
  { id: "instagram", label: "Instagram", placeholder: "@compte ou lien" },
  { id: "tiktok", label: "TikTok", placeholder: "@compte ou lien" },
  { id: "email", label: "E-mail", placeholder: "toi@exemple.fr" },
  { id: "portfolio", label: "Portfolio", placeholder: "https://…" },
  { id: "autre", label: "Autre lien", placeholder: "https://…" },
] as const;

type LinkId = (typeof LINK_FIELDS)[number]["id"];

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputClasses =
  "w-full border border-iron-line bg-ash px-3.5 py-2.5 text-sm text-bone placeholder:text-steel/60 transition-colors focus:border-ember-glow focus:outline-none";

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
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

export function RecruitmentForm({
  discordName,
  linkedMinecraftPseudo,
}: {
  discordName: string | null;
  linkedMinecraftPseudo: string | null;
}) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<RoleDefinition | null>(null);
  const [roleFields, setRoleFields] = useState<Record<string, string>>({});
  const [minecraftPseudo, setMinecraftPseudo] = useState(linkedMinecraftPseudo ?? "");
  const [links, setLinks] = useState<Record<LinkId, string>>({
    discord: "",
    instagram: "",
    tiktok: "",
    email: "",
    portfolio: "",
    autre: "",
  });
  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketChannel, setTicketChannel] = useState<string | null>(null);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);

  /* Widget Turnstile : monté uniquement à l'étape d'envoi, et seulement si
     la clé publique existe — sans clé, le honeypot suffit. */
  useEffect(() => {
    if (step !== 3 || !TURNSTILE_SITE_KEY) return;
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
  }, [step]);

  const missingRequiredFields = useMemo(() => {
    if (!role) return [];
    return role.fields.filter((field) => field.required && !(roleFields[field.id] ?? "").trim());
  }, [role, roleFields]);

  function selectRole(next: RoleDefinition) {
    if (role?.id === next.id) return;
    setRole(next);
    // Réinitialise les champs spécifiques : ils n'ont de sens que pour ce rôle.
    const fresh: Record<string, string> = {};
    for (const field of next.fields) fresh[field.id] = "";
    setRoleFields(fresh);
    setStepError(null);
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      return role ? null : "Choisis un poste pour continuer.";
    }
    if (current === 1) {
      if (missingRequiredFields.length > 0) {
        return `Complète ${missingRequiredFields.length > 1 ? "les champs requis" : "le champ requis"} : ${missingRequiredFields.map((f) => f.label).join(", ")}.`;
      }
      return null;
    }
    if (current === 2) {
      if (minecraftPseudo.trim() && !MINECRAFT_PSEUDO_PATTERN.test(minecraftPseudo.trim())) {
        return "Pseudo Minecraft invalide (3 à 16 caractères : lettres, chiffres, underscore).";
      }
      if (links.email.trim() && !EMAIL_PATTERN.test(links.email.trim())) {
        return "Adresse e-mail invalide.";
      }
      if (!experience) return "Indique ton niveau d'expérience.";
      if (motivation.trim().length < MOTIVATION_MIN_LENGTH) {
        return `Ta motivation doit faire au moins ${MOTIVATION_MIN_LENGTH} caractères — dis-nous ce que tu veux apporter.`;
      }
      return null;
    }
    if (current === 3) {
      if (!consent) return "Coche la case de consentement pour transmettre ta candidature.";
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        return "Vérification anti-robot en cours — patiente un instant.";
      }
      return null;
    }
    return null;
  }

  function goNext() {
    const error = validateStep(step);
    setStepError(error);
    if (!error) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const error = validateStep(3);
    setStepError(error);
    if (error || status === "submitting") return;

    setStatus("submitting");
    setSubmitError(null);
    try {
      const res = await fetch("/api/recrutement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role?.id ?? "",
          fields: roleFields,
          minecraftPseudo: minecraftPseudo.trim(),
          links: Object.fromEntries(
            Object.entries(links).map(([key, value]) => [key, value.trim()]),
          ),
          experience,
          motivation: motivation.trim(),
          consent,
          website: honeypot,
          turnstileToken: turnstileToken ?? "",
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; channel?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setStatus("error");
        setSubmitError(data?.error ?? "Une erreur est survenue. Réessaie dans un instant.");
        return;
      }
      setTicketChannel(data.channel ?? null);
      setStatus("success");
    } catch {
      setStatus("error");
      setSubmitError("Impossible de joindre le serveur. Vérifie ta connexion et réessaie.");
    }
  }

  /* ——— État succès : confirmation pleine largeur ——— */
  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-6 border border-ember/60 bg-iron p-8 sm:p-12">
        <Stamp tone="gold">Transmise</Stamp>
        <h3 className="font-display text-2xl font-semibold leading-tight text-bone sm:text-3xl">
          Candidature transmise — un ticket a été ouvert.
        </h3>
        <p className="max-w-2xl text-sm leading-relaxed text-steel">
          Ta candidature pour le poste{" "}
          <span className="text-bone">{role?.title}</span> a été déposée dans le registre.
          Un salon privé
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
          Réponse de la direction — Fondateur / Co-fondateur / Directeur
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-iron-line bg-iron">
      {/* ——— Barre de progression ——— */}
      <ol className="grid grid-cols-4 border-b border-iron-line/60">
        {STEPS.map((s, index) => {
          const isCurrent = index === step;
          const isDone = index < step;
          return (
            <li
              key={s.id}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex flex-col gap-1.5 border-r border-iron-line/60 px-3 py-3.5 last:border-r-0 sm:px-5 ${
                isCurrent ? "bg-iron-light" : ""
              }`}
            >
              <span
                className={`font-tech text-[10px] uppercase tracking-[0.22em] ${
                  isCurrent ? "text-ember-glow" : isDone ? "text-bone" : "text-steel/70"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`hidden font-display text-sm font-semibold sm:block ${
                  isCurrent ? "text-bone" : isDone ? "text-bone/80" : "text-steel/70"
                }`}
              >
                {s.label}
              </span>
              <span
                aria-hidden="true"
                className={`mt-1 h-0.5 w-full ${isDone || isCurrent ? "bg-ember" : "bg-iron-line"}`}
              />
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-8 p-6 sm:p-10">
        {/* ——— Étape 1 : choix du poste ——— */}
        {step === 0 && (
          <fieldset className="flex flex-col gap-5">
            <legend className="sr-only">Choix du poste</legend>
            <p className="text-sm leading-relaxed text-steel">
              Un seul poste par candidature. Choisis celui où tu seras le plus utile —
              tu pourras toujours évoluer ensuite.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {RECRUITMENT_ROLES.map((candidate) => {
                const selected = role?.id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => selectRole(candidate)}
                    aria-pressed={selected}
                    className={`card-lift flex flex-col gap-2 border p-5 text-left ${
                      selected
                        ? "border-ember bg-ash"
                        : "border-iron-line bg-ash hover:border-steel"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        aria-hidden="true"
                        className={`font-display text-xl font-semibold ${
                          selected ? "text-ember-glow" : "text-steel"
                        }`}
                      >
                        {candidate.num}
                      </span>
                      {selected && <Stamp tone="ember">Choisi</Stamp>}
                    </div>
                    <span className="font-display text-lg font-semibold text-bone">
                      {candidate.title}
                    </span>
                    <span className="text-xs leading-relaxed text-steel">{candidate.tagline}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* ——— Étape 2 : champs dynamiques du poste ——— */}
        {step === 1 && role && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Stamp tone="ember">{role.title}</Stamp>
              <p className="text-sm text-steel">{role.description}</p>
            </div>
            {role.fields.map((field: RoleField) => (
              <div key={field.id} className="flex flex-col gap-2">
                <FieldLabel htmlFor={`role-${field.id}`} label={field.label} required={field.required} />
                {field.type === "textarea" ? (
                  <textarea
                    id={`role-${field.id}`}
                    value={roleFields[field.id] ?? ""}
                    onChange={(event) =>
                      setRoleFields((prev) => ({ ...prev, [field.id]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    rows={4}
                    className={`${inputClasses} resize-y`}
                  />
                ) : (
                  <input
                    id={`role-${field.id}`}
                    type={field.type === "url" ? "url" : "text"}
                    value={roleFields[field.id] ?? ""}
                    onChange={(event) =>
                      setRoleFields((prev) => ({ ...prev, [field.id]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={inputClasses}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ——— Étape 3 : infos transverses ——— */}
        {step === 2 && (
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="mc-pseudo" label="Pseudo Minecraft" />
              <input
                id="mc-pseudo"
                type="text"
                value={minecraftPseudo}
                onChange={(event) => setMinecraftPseudo(event.target.value)}
                placeholder="Ex. Steve_2009 — optionnel"
                maxLength={16}
                className={`${inputClasses} sm:max-w-xs`}
              />
              <span className="text-xs text-steel">
                {linkedMinecraftPseudo
                  ? "Pré-rempli depuis ton compte lié — corrige si besoin."
                  : "Si tu joues déjà sur Cantale, la direction regardera ton profil."}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                Liens utiles — tous optionnels
              </span>
              <div className="grid gap-4 sm:grid-cols-2">
                {LINK_FIELDS.map((link) => (
                  <div key={link.id} className="flex flex-col gap-2">
                    <FieldLabel htmlFor={`link-${link.id}`} label={link.label} />
                    <input
                      id={`link-${link.id}`}
                      type="text"
                      value={links[link.id]}
                      onChange={(event) =>
                        setLinks((prev) => ({ ...prev, [link.id]: event.target.value }))
                      }
                      placeholder={link.placeholder}
                      maxLength={LINK_MAX_LENGTH}
                      className={inputClasses}
                    />
                  </div>
                ))}
              </div>
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                Niveau d&apos;expérience <span className="text-ember-glow">requis</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {EXPERIENCE_LEVELS.map((level) => {
                  const selected = experience === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setExperience(level.id)}
                      aria-pressed={selected}
                      className={`flex flex-col gap-0.5 border px-4 py-3 text-left transition-colors ${
                        selected
                          ? "border-ember bg-ash"
                          : "border-iron-line bg-ash hover:border-steel"
                      }`}
                    >
                      <span
                        className={`font-display text-sm font-semibold ${
                          selected ? "text-bone" : "text-bone/80"
                        }`}
                      >
                        {level.label}
                      </span>
                      <span className="text-xs text-steel">{level.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="motivation" label="Ta motivation" required />
              <textarea
                id="motivation"
                value={motivation}
                onChange={(event) => setMotivation(event.target.value)}
                placeholder="Pourquoi toi, pourquoi Cantale, et ce que tu veux y apporter concrètement."
                maxLength={MOTIVATION_MAX_LENGTH}
                rows={6}
                className={`${inputClasses} resize-y`}
              />
              <span
                className={`font-tech text-[10px] uppercase tracking-[0.2em] ${
                  motivation.trim().length < MOTIVATION_MIN_LENGTH ? "text-steel" : "text-ember-glow"
                }`}
              >
                {motivation.trim().length}/{MOTIVATION_MAX_LENGTH} — minimum {MOTIVATION_MIN_LENGTH} caractères
              </span>
            </div>
          </div>
        )}

        {/* ——— Étape 4 : récapitulatif + consentement ——— */}
        {step === 3 && role && (
          <div className="flex flex-col gap-7">
            <dl className="grid gap-px border border-iron-line bg-iron-line sm:grid-cols-2">
              <div className="flex flex-col gap-1 bg-iron px-4 py-3.5">
                <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">Poste</dt>
                <dd className="font-display text-base font-semibold text-bone">{role.title}</dd>
              </div>
              <div className="flex flex-col gap-1 bg-iron px-4 py-3.5">
                <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                  Pseudo Minecraft
                </dt>
                <dd className="font-display text-base font-semibold text-bone">
                  {minecraftPseudo.trim() || "Non renseigné"}
                </dd>
              </div>
              <div className="flex flex-col gap-1 bg-iron px-4 py-3.5">
                <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                  Expérience
                </dt>
                <dd className="font-display text-base font-semibold text-bone">
                  {EXPERIENCE_LEVELS.find((level) => level.id === experience)?.label ?? "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-1 bg-iron px-4 py-3.5">
                <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                  Compte Discord
                </dt>
                <dd className="font-display text-base font-semibold text-bone">
                  {discordName ?? "Non connecté"}
                </dd>
              </div>
              {role.fields.map((field) => {
                const value = (roleFields[field.id] ?? "").trim();
                if (!value) return null;
                return (
                  <div key={field.id} className="flex flex-col gap-1 bg-iron px-4 py-3.5 sm:col-span-2">
                    <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                      {field.label}
                    </dt>
                    <dd className="whitespace-pre-line text-sm leading-relaxed text-bone/90">{value}</dd>
                  </div>
                );
              })}
              <div className="flex flex-col gap-1 bg-iron px-4 py-3.5 sm:col-span-2">
                <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                  Motivation
                </dt>
                <dd className="whitespace-pre-line text-sm leading-relaxed text-bone/90">
                  {motivation.trim()}
                </dd>
              </div>
            </dl>

            <label className="flex cursor-pointer items-start gap-3 border border-iron-line bg-ash p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none border border-iron-line bg-ash transition-colors checked:border-ember checked:bg-ember"
              />
              <span className="text-sm leading-relaxed text-steel">
                J&apos;accepte que ces informations soient transmises à l&apos;équipe CANTALE.
                Elles seront visibles par la direction dans un salon privé du Discord, et
                utilisées uniquement pour traiter ma candidature.
              </span>
            </label>

            {TURNSTILE_SITE_KEY && (
              <div ref={turnstileContainerRef} className="min-h-[65px]" />
            )}

            {submitError && (
              <p className="border border-ember/60 bg-ash px-4 py-3 text-sm text-ember-glow" role="alert">
                {submitError}
              </p>
            )}
          </div>
        )}

        {/* ——— Honeypot : invisible pour les humains, rempli par les bots ——— */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="recrutement-website">Ne pas remplir</label>
          <input
            id="recrutement-website"
            type="text"
            name="website"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {stepError && (
          <p className="border border-ember/60 bg-ash px-4 py-3 text-sm text-ember-glow" role="alert">
            {stepError}
          </p>
        )}

        {/* ——— Navigation ——— */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-iron-line/60 pt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={status === "submitting"}
              className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Retour
            </button>
          ) : (
            <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel/60">
              Candidature en quatre temps
            </span>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="pressable border border-ember px-5 py-2.5 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone"
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "submitting" || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
              className="pressable bg-ember px-5 py-2.5 font-tech text-[11px] uppercase tracking-[0.22em] text-bone hover:bg-ember-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "submitting" ? "Transmission…" : "Envoyer ma candidature"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
