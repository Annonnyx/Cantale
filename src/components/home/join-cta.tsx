import Link from "next/link";
import { CopyIp } from "@/components/layout/copy-ip";

export function JoinCta() {
  return (
    <section
      id="rejoindre"
      aria-labelledby="rejoindre-title"
      className="relative overflow-hidden border-t border-iron-line/60"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[50vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(ellipse at center, var(--color-ember) 0%, transparent 65%)" }}
      />
      <div className="reveal relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-5 py-24 text-center sm:px-8 sm:py-32">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Rejoindre la forge
        </span>
        <h2 id="rejoindre-title" className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-6xl">
          Trois encoches t&apos;attendent.
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-steel">
          Copie l&apos;adresse, lance Minecraft 1.21, et entre dans le registre. Ta première vie
          commence à l&apos;instant où tu spawnes.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <CopyIp />
          <a
            href="https://discord.gg/65a9upGPHx"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex items-center gap-3 border border-ember px-5 py-3 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone"
          >
            Rejoindre le Discord
          </a>
        </div>
        <p className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
          Avant d&apos;entrer,{" "}
          <Link
            href="/reglement"
            className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
          >
            lis le règlement
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
