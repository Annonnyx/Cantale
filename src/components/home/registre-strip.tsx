const ITEMS = [
  "play.cantale.world",
  "3 vies",
  "PvP factions",
  "Cantox",
  "Zones contestées",
  "Items forgés",
  "Primes wanted",
  "Caisses de clés",
];

export function RegistreStrip() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-iron-line/60 bg-ash-deep py-3"
    >
      <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-tech text-[10px] uppercase tracking-[0.3em] text-steel"
          >
            {item}
            <span className="text-ember">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
