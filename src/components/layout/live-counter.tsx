"use client";

import { useEffect, useState } from "react";

type Status = { online: number; max: number | null };

async function fetchStatus(): Promise<Status | null> {
  try {
    const res = await fetch("/api/server/status", { signal: AbortSignal.timeout(4_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<Status>;
    return typeof data.online === "number" ? { online: data.online, max: data.max ?? null } : null;
  } catch {
    return null;
  }
}

export function LiveCounter() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const s = await fetchStatus();
      if (!cancelled) setStatus(s);
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!status) return null;

  return (
    <span className="flex items-center gap-2 font-tech text-[11px] uppercase tracking-[0.2em] text-steel-light">
      <span aria-hidden className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-ember-glow" />
      <span className="text-bone">{status.online}</span>
      <span className="hidden sm:inline">en ligne</span>
      <span className="sr-only">joueurs actuellement connectés</span>
    </span>
  );
}
