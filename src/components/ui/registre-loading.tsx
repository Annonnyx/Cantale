/** Squelette de page data — affiché pendant le fetch MySQL (loading.tsx). */
export function RegistreLoading({
  kicker = "Registre",
  label = "Le registre se charge…",
}: {
  kicker?: string;
  label?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
        {kicker}
      </span>
      <div className="mt-4 h-10 w-64 max-w-full bg-iron-line/40" aria-hidden />
      <p className="mt-6 font-tech text-[10px] uppercase tracking-[0.24em] text-steel">{label}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 border border-iron-line bg-iron" aria-hidden />
        ))}
      </div>
    </main>
  );
}
