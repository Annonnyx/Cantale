import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/legal/cookie-notice";
import { RevealObserver } from "@/components/ui/reveal-observer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cantale.world"),
  title: {
    default: "CANTALE — L'effort crée les forts",
    template: "%s — CANTALE",
  },
  description:
    "CANTALE est un serveur Minecraft PvP factions hardcore. Trois vies, une seule légende : claims, Cantox, items forgés, zones contestées.",
  keywords: [
    "CANTALE",
    "serveur Minecraft",
    "serveur Minecraft français",
    "Minecraft PvP factions",
    "factions hardcore",
    "serveur PvP hardcore",
    "Minecraft 1.21",
    "trois vies",
    "claims",
    "Cantox",
    "items forgés",
  ],
  openGraph: {
    siteName: "CANTALE",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ash font-sans text-bone">
        <RevealObserver />
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        <CookieNotice />
      </body>
    </html>
  );
}
