type NotchState = "burning" | "extinct" | "cracked";

const STATE_FILL: Record<NotchState, string> = {
  burning: "var(--color-ember-glow)",
  extinct: "var(--color-steel)",
  cracked: "var(--color-iron-line)",
};

function Notch({ state, label }: { state: NotchState; label: string }) {
  return (
    <svg
      viewBox="0 0 24 40"
      role="img"
      aria-label={label}
      className={`h-10 w-6 ${state === "burning" ? "notch-burning" : ""}`}
    >
      <title>{label}</title>
      <path
        d="M4 2h16l2 6-4 4v22l-3 4H9l-3-4V12L2 8l2-6z"
        fill={STATE_FILL[state]}
        stroke="var(--color-ash-deep)"
        strokeWidth="1.5"
      />
      {state === "cracked" && (
        <path
          d="M12 8l-3 8 4 5-3 7 4 6"
          fill="none"
          stroke="var(--color-ash-deep)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
      {state === "burning" && (
        <path d="M7 6h10l1 2.5L14 12h-4l-4-3.5L7 6z" fill="var(--color-bone)" opacity="0.35" />
      )}
    </svg>
  );
}

/**
 * Signature CANTALE : trois encoches forgées.
 * burning = vie active, extinct = vie perdue, cracked = mort définitive.
 */
export function LifeNotches({
  lives,
  size = "md",
}: {
  lives: 0 | 1 | 2 | 3;
  size?: "sm" | "md";
}) {
  const states: NotchState[] = [0, 1, 2].map((i) => {
    if (i < lives) return "burning" as const;
    return lives === 0 ? ("cracked" as const) : ("extinct" as const);
  });

  const labels = ["Première vie", "Deuxième vie", "Troisième vie"];

  return (
    <span
      role="img"
      aria-label={`${lives} vie${lives > 1 ? "s" : ""} restante${lives > 1 ? "s" : ""} sur 3`}
      className={`inline-flex items-end gap-1.5 ${size === "sm" ? "[&_svg]:h-7 [&_svg]:w-4" : ""}`}
    >
      {states.map((state, i) => (
        <Notch key={labels[i]} state={state} label={`${labels[i]} : ${state === "burning" ? "active" : state === "extinct" ? "perdue" : "brisée"}`} />
      ))}
    </span>
  );
}
