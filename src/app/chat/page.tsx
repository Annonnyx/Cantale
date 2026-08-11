import type { Metadata } from "next";
import { getSessionUser } from "@/server/session";
import {
  getFactionName,
  getPlayerFactionId,
  getRecentGlobalChat,
} from "@/server/repo/chat";
import { ChatPanel } from "./chat-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Chat global et chat de faction de CANTALE — lis le jeu depuis le site, parle si ton compte est lié.",
};

export default async function ChatPage() {
  const session = await getSessionUser();
  const messages = await getRecentGlobalChat(80).catch(() => []);
  let factionId: number | null = null;
  let factionName: string | null = null;
  if (session.mc) {
    factionId = await getPlayerFactionId(session.mc.uuid).catch(() => null);
    if (factionId) factionName = await getFactionName(factionId).catch(() => null);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
        En direct
      </span>
      <h1 className="mt-3 font-display text-4xl font-semibold text-bone sm:text-5xl">Chat</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-steel-light sm:text-base">
        Onglet Global pour tout le serveur ; onglet Faction pour ta fac uniquement (compte lié +
        membre). En jeu,{" "}
        <span className="font-tech text-ember-glow">/fc</span> bascule le chat faction.
      </p>

      <div className="mt-10">
        <ChatPanel
          initialMessages={messages}
          canSpeakGlobal={session.mc !== null}
          hasFaction={factionId !== null}
          factionName={factionName}
          speaker={session.mc?.username ?? null}
        />
      </div>
    </main>
  );
}
