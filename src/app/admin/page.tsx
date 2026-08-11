import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { env } from "@/server/env";
import { getSessionUser } from "@/server/session";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getSessionUser();
  const allowed = env.adminDiscordIds;

  if (!session.discordUser) {
    redirect("/connexion");
  }
  if (allowed.length === 0 || !allowed.includes(session.discordUser.id)) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
        Accès restreint
      </span>
      <h1 className="mt-3 font-display text-4xl font-semibold text-bone">Admin</h1>
      <p className="mt-4 max-w-2xl text-sm text-steel-light">
        Actions via file plugin (~2 s). Joueurs en ligne : liste JSON mise à jour chaque minute.
      </p>
      <div className="mt-10">
        <AdminPanel />
      </div>
    </main>
  );
}
