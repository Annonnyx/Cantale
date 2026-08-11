import type { Metadata } from "next";
import { getSessionUser } from "@/server/session";
import { getRecentChatMessages } from "@/server/repo/chat";
import { ChatPanel } from "./chat-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Chat global de CANTALE en direct — lis le jeu depuis le site, parle si ton compte Minecraft est lié.",
};

export default async function ChatPage() {
  const [session, messages] = await Promise.all([
    getSessionUser(),
    getRecentChatMessages(80).catch(() => []),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
        En direct
      </span>
      <h1 className="mt-3 font-display text-4xl font-semibold text-bone sm:text-5xl">Chat</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-steel-light sm:text-base">
        Le fil public du serveur. Tout le monde peut lire ; seuls les comptes Discord liés à
        Minecraft peuvent envoyer un message.
      </p>

      <div className="mt-10">
        <ChatPanel
          initialMessages={messages}
          canSpeak={session.mc !== null}
          speaker={session.mc?.username ?? null}
        />
      </div>
    </main>
  );
}
