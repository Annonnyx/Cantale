const LETTERS = ["C", "A", "N", "T", "A", "L", "E"];

export function Hero() {
  return (
    <section
      aria-label="CANTALE — L'effort crée les forts"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ash px-4"
    >
      {/* Halo de braise très discret derrière le mot */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(ellipse at center, var(--color-ember) 0%, transparent 65%)" }}
      />

      <h1
        aria-label="CANTALE"
        className="relative select-none text-center font-hero leading-none text-bone"
        style={{ fontSize: "clamp(4.5rem, 17vw, 15rem)", letterSpacing: "0.06em" }}
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            aria-hidden
            className="hero-letter"
            style={{ animationDelay: `${150 + i * 90}ms` }}
          >
            {letter}
          </span>
        ))}
      </h1>

      <p
        className="hero-fade relative mt-8 pl-[0.28em] text-center font-tech text-[11px] uppercase tracking-[0.28em] text-steel sm:pl-[0.5em] sm:text-xs sm:tracking-[0.5em]"
        style={{ animationDelay: "1s" }}
      >
        L&apos;effort crée les forts
      </p>

      <div
        aria-hidden
        className="hero-fade absolute bottom-10 flex flex-col items-center gap-3"
        style={{ animationDelay: "1.6s" }}
      >
        <span className="font-tech text-[9px] uppercase tracking-[0.35em] text-steel">Défiler</span>
        <span className="h-10 w-px bg-gradient-to-b from-ember to-transparent" />
      </div>
    </section>
  );
}
