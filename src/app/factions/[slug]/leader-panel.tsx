"use client";

import { useState } from "react";
import { Stamp } from "@/components/ui/stamp";
import type { FactionRank } from "@/server/repo/factions";

export type PanelMember = {
  uuid: string;
  username: string | null;
  rank: FactionRank;
};

export type PanelApplication = {
  id: number;
  applicantUuid: string;
  username: string | null;
  message: string;
  /** unix secondes. */
  createdAt: number;
};

type Notice = { kind: "ok" | "error"; text: string } | null;

/** Échelle des grades gérables depuis le web — LEADER reste l'apanage du jeu. */
const RANK_LADDER: readonly FactionRank[] = ["RECRUIT", "MEMBER", "VETERAN", "OFFICER"];

const RANK_LABELS: Record<FactionRank, string> = {
  LEADER: "Leader",
  OFFICER: "Officier",
  VETERAN: "Vétéran",
  MEMBER: "Membre",
  RECRUIT: "Recrue",
};

function rankUp(rank: FactionRank): FactionRank | null {
  const index = RANK_LADDER.indexOf(rank);
  return index >= 0 && index < RANK_LADDER.length - 1 ? RANK_LADDER[index + 1] : null;
}

function rankDown(rank: FactionRank): FactionRank | null {
  const index = RANK_LADDER.indexOf(rank);
  return index > 0 ? RANK_LADDER[index - 1] : null;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

function formatDate(unixSeconds: number): string {
  return DATE_FORMATTER.format(new Date(unixSeconds * 1000));
}

function displayName(username: string | null, uuid: string): string {
  return username ?? `Joueur ${uuid.slice(0, 8)}`;
}

type BridgeOutcome = { status: "done" | "failed" | "timeout"; result: string | null };

/**
 * Le plugin traite la file en ~15 s : on interroge le statut de l'action
 * jusqu'à sa résolution (ou 45 s, au-delà on invite à vérifier en jeu).
 */
async function pollBridgeAction(id: number): Promise<BridgeOutcome> {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      const res = await fetch(`/api/factions/actions/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { status?: string; result?: string | null };
        if (data.status === "done" || data.status === "failed") {
          return { status: data.status, result: data.result ?? null };
        }
      }
    } catch {
      // Réseau capricieux : on retente jusqu'au délai maximum.
    }
  }
  return { status: "timeout", result: null };
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = ((await res.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  return { ok: res.ok, data };
}

function errorText(data: Record<string, unknown>, fallback: string): string {
  return typeof data.error === "string" ? data.error : fallback;
}

export function LeaderPanel({
  slug,
  initialRecruitmentOpen,
  initialDescription,
  initialMembers,
  initialApplications,
}: {
  slug: string;
  initialRecruitmentOpen: boolean;
  initialDescription: string;
  initialMembers: PanelMember[];
  initialApplications: PanelApplication[];
}) {
  const [recruitmentOpen, setRecruitmentOpen] = useState(initialRecruitmentOpen);
  const [savingRecruitment, setSavingRecruitment] = useState(false);
  const [description, setDescription] = useState(initialDescription);
  const [savingDescription, setSavingDescription] = useState(false);
  const [members, setMembers] = useState<PanelMember[]>(initialMembers);
  const [applications, setApplications] = useState<PanelApplication[]>(initialApplications);
  const [memberBusy, setMemberBusy] = useState<Record<string, boolean>>({});
  const [applicationBusy, setApplicationBusy] = useState<Record<number, boolean>>({});
  const [notice, setNotice] = useState<Notice>(null);

  async function toggleRecruitment() {
    if (savingRecruitment) return;
    setSavingRecruitment(true);
    setNotice(null);
    const next = !recruitmentOpen;
    try {
      const { ok, data } = await postJson(`/api/factions/${slug}/settings`, {
        recruitmentOpen: next,
      });
      if (!ok) {
        setNotice({ kind: "error", text: errorText(data, "Le réglage n'a pas pu être enregistré.") });
        return;
      }
      setRecruitmentOpen(next);
      setNotice({
        kind: "ok",
        text: next
          ? "Recrutement ouvert — ta faction apparaît comme « Recrute » dans l'annuaire."
          : "Recrutement fermé — les candidatures sont closes.",
      });
    } catch {
      setNotice({ kind: "error", text: "Impossible de joindre le serveur. Réessaie dans un instant." });
    } finally {
      setSavingRecruitment(false);
    }
  }

  async function saveDescription() {
    if (savingDescription) return;
    setSavingDescription(true);
    setNotice(null);
    try {
      const { ok, data } = await postJson(`/api/factions/${slug}/settings`, { description });
      if (!ok) {
        setNotice({ kind: "error", text: errorText(data, "La description n'a pas pu être enregistrée.") });
        return;
      }
      setNotice({ kind: "ok", text: "Description enregistrée — elle remplace celle du plugin sur le site." });
    } catch {
      setNotice({ kind: "error", text: "Impossible de joindre le serveur. Réessaie dans un instant." });
    } finally {
      setSavingDescription(false);
    }
  }

  async function changeRank(member: PanelMember, target: FactionRank) {
    if (memberBusy[member.uuid]) return;
    setMemberBusy((prev) => ({ ...prev, [member.uuid]: true }));
    setNotice(null);
    const name = displayName(member.username, member.uuid);
    try {
      const { ok, data } = await postJson(`/api/factions/${slug}/rank`, {
        playerUuid: member.uuid,
        rank: target,
      });
      if (!ok) {
        setNotice({ kind: "error", text: errorText(data, `Le grade de ${name} n'a pas pu être changé.`) });
        return;
      }
      const actionId = typeof data.actionId === "number" ? data.actionId : null;
      if (actionId === null) {
        setNotice({ kind: "error", text: "Réponse inattendue du serveur — vérifie en jeu." });
        return;
      }
      const outcome = await pollBridgeAction(actionId);
      if (outcome.status === "done") {
        setMembers((prev) =>
          prev.map((entry) => (entry.uuid === member.uuid ? { ...entry, rank: target } : entry)),
        );
        setNotice({ kind: "ok", text: `${name} est désormais ${RANK_LABELS[target]}.` });
      } else if (outcome.status === "failed") {
        setNotice({
          kind: "error",
          text: `Le jeu a refusé le changement de ${name} : ${outcome.result ?? "raison inconnue"}.`,
        });
      } else {
        setNotice({
          kind: "ok",
          text: `Changement envoyé pour ${name} — le jeu n'a pas encore confirmé, vérifie en jeu.`,
        });
      }
    } catch {
      setNotice({ kind: "error", text: "Impossible de joindre le serveur. Réessaie dans un instant." });
    } finally {
      setMemberBusy((prev) => ({ ...prev, [member.uuid]: false }));
    }
  }

  async function resolve(application: PanelApplication, decision: "accept" | "refuse") {
    if (applicationBusy[application.id]) return;
    setApplicationBusy((prev) => ({ ...prev, [application.id]: true }));
    setNotice(null);
    const name = displayName(application.username, application.applicantUuid);
    try {
      const { ok, data } = await postJson(
        `/api/factions/${slug}/applications/${application.id}/resolve`,
        { decision },
      );
      if (!ok) {
        setNotice({ kind: "error", text: errorText(data, "La candidature n'a pas pu être traitée.") });
        return;
      }

      if (decision === "refuse") {
        setApplications((prev) => prev.filter((entry) => entry.id !== application.id));
        setNotice({ kind: "ok", text: `Candidature de ${name} refusée.` });
        return;
      }

      // Acceptation : la candidature est actée, le join passe par le bridge plugin.
      const actionId = typeof data.actionId === "number" ? data.actionId : null;
      if (actionId === null) {
        setApplications((prev) => prev.filter((entry) => entry.id !== application.id));
        setNotice({ kind: "ok", text: `Candidature de ${name} acceptée — vérifie son arrivée en jeu.` });
        return;
      }
      const outcome = await pollBridgeAction(actionId);
      setApplications((prev) => prev.filter((entry) => entry.id !== application.id));
      if (outcome.status === "done") {
        setMembers((prev) => [
          ...prev,
          { uuid: application.applicantUuid, username: application.username, rank: "RECRUIT" },
        ]);
        setNotice({ kind: "ok", text: `${name} a rejoint la faction comme Recrue.` });
      } else if (outcome.status === "failed") {
        setNotice({
          kind: "error",
          text: `Candidature acceptée, mais le jeu a refusé l'arrivée de ${name} : ${outcome.result ?? "raison inconnue"}.`,
        });
      } else {
        setNotice({
          kind: "ok",
          text: `Candidature de ${name} acceptée — le jeu n'a pas encore confirmé, vérifie en jeu.`,
        });
      }
    } catch {
      setNotice({ kind: "error", text: "Impossible de joindre le serveur. Réessaie dans un instant." });
    } finally {
      setApplicationBusy((prev) => ({ ...prev, [application.id]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-8 border border-gold/40 bg-iron p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Stamp tone="gold" rotation={1.5}>
          Panneau du leader
        </Stamp>
        <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
          Visible par toi seul
        </span>
      </div>

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`border px-4 py-3 text-sm ${
            notice.kind === "error"
              ? "border-ember/60 bg-ash text-ember-glow"
              : "border-gold/50 bg-ash text-gold"
          }`}
        >
          {notice.text}
        </p>
      )}

      {/* ——— Recrutement ——— */}
      <section aria-label="Recrutement" className="flex flex-col gap-4 border-t border-iron-line/60 pt-6">
        <h3 className="font-display text-lg font-semibold text-bone">Recrutement</h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-steel">
            {recruitmentOpen
              ? "Les joueurs sans faction peuvent postuler depuis la page de ta faction."
              : "Aucune candidature ne peut être déposée tant que le recrutement est fermé."}
          </p>
          <button
            type="button"
            onClick={toggleRecruitment}
            disabled={savingRecruitment}
            aria-pressed={recruitmentOpen}
            className={`shrink-0 border px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              recruitmentOpen
                ? "border-iron-line text-steel hover:border-bone hover:text-bone"
                : "border-ember text-ember-glow hover:bg-ember hover:text-bone"
            }`}
          >
            {savingRecruitment
              ? "Enregistrement…"
              : recruitmentOpen
                ? "Fermer le recrutement"
                : "Ouvrir le recrutement"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="leader-description"
            className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel"
          >
            Description publique
          </label>
          <textarea
            id="leader-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="La parole de ta faction, affichée sur le site. Vide → la description du plugin reprend."
            className="w-full resize-y border border-iron-line bg-ash px-3.5 py-2.5 text-sm text-bone placeholder:text-steel/60 transition-colors focus:border-ember-glow focus:outline-none"
          />
          <div className="flex items-center justify-between gap-4">
            <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
              {description.trim().length}/1000
            </span>
            <button
              type="button"
              onClick={saveDescription}
              disabled={savingDescription}
              className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingDescription ? "Enregistrement…" : "Enregistrer la description"}
            </button>
          </div>
        </div>
      </section>

      {/* ——— Candidatures ——— */}
      <section aria-label="Candidatures en attente" className="flex flex-col gap-4 border-t border-iron-line/60 pt-6">
        <h3 className="font-display text-lg font-semibold text-bone">
          Candidatures — {applications.length} en attente
        </h3>
        {applications.length === 0 ? (
          <p className="text-sm leading-relaxed text-steel">
            Aucune candidature en attente. Ouvre le recrutement pour en recevoir.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {applications.map((application) => {
              const busy = Boolean(applicationBusy[application.id]);
              return (
                <li
                  key={application.id}
                  className="flex flex-col gap-3 border border-iron-line bg-ash p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-base font-semibold text-bone">
                      {displayName(application.username, application.applicantUuid)}
                    </span>
                    <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                      Le {formatDate(application.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-bone/90">
                    {application.message}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => resolve(application, "accept")}
                      disabled={busy}
                      className="pressable border border-ember px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? "Traitement…" : "Accepter"}
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve(application, "refuse")}
                      disabled={busy}
                      className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ——— Grades ——— */}
      <section aria-label="Grades des membres" className="flex flex-col gap-4 border-t border-iron-line/60 pt-6">
        <h3 className="font-display text-lg font-semibold text-bone">Grades</h3>
        <p className="text-sm leading-relaxed text-steel">
          Recrue → Membre → Vétéran → Officier. Le changement est appliqué en jeu sous
          une quinzaine de secondes.
        </p>
        {members.length === 0 ? (
          <p className="text-sm leading-relaxed text-steel">Aucun membre à gérer.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((member) => {
              const up = rankUp(member.rank);
              const down = rankDown(member.rank);
              const busy = Boolean(memberBusy[member.uuid]);
              return (
                <li
                  key={member.uuid}
                  className="flex flex-wrap items-center gap-3 border border-iron-line bg-ash px-4 py-3"
                >
                  <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-bone">
                    {displayName(member.username, member.uuid)}
                  </span>
                  <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-ember-glow">
                    {RANK_LABELS[member.rank]}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => up && changeRank(member, up)}
                      disabled={!up || busy}
                      aria-label={
                        up
                          ? `Promouvoir ${displayName(member.username, member.uuid)} au grade ${RANK_LABELS[up]}`
                          : "Grade maximal atteint"
                      }
                      className="pressable border border-iron-line px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] text-steel transition-colors hover:border-bone hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy ? "…" : up ? `→ ${RANK_LABELS[up]}` : "Grade max"}
                    </button>
                    <button
                      type="button"
                      onClick={() => down && changeRank(member, down)}
                      disabled={!down || busy}
                      aria-label={
                        down
                          ? `Rétrograder ${displayName(member.username, member.uuid)} au grade ${RANK_LABELS[down]}`
                          : "Grade minimal atteint"
                      }
                      className="pressable border border-iron-line px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] text-steel transition-colors hover:border-bone hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {down ? `→ ${RANK_LABELS[down]}` : "Grade min"}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
