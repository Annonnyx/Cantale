"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getSearchIndex, type WikiSearchEntry } from "@/lib/wiki-content";

const SEARCH_INDEX = getSearchIndex();
const MAX_RESULTS = 8;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreEntry(entry: WikiSearchEntry, query: string): number {
  const title = normalize(entry.title);
  if (title.startsWith(query)) return 3;
  if (title.includes(query)) return 2;
  if (normalize(entry.text).includes(query)) return 1;
  return 0;
}

function subscribeNoop() {
  return () => {};
}

function getShortcutSnapshot(): string {
  return /mac/i.test(navigator.platform) ? "⌘ K" : "Ctrl K";
}

function getShortcutServerSnapshot(): string {
  return "Ctrl K";
}

export function WikiSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const shortcut = useSyncExternalStore(
    subscribeNoop,
    getShortcutSnapshot,
    getShortcutServerSnapshot,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const trimmed = normalize(query.trim());
    if (trimmed.length < 2) return [];
    return SEARCH_INDEX.map((entry) => ({ entry, score: scoreEntry(entry, trimmed) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
      .slice(0, MAX_RESULTS)
      .map(({ entry }) => entry);
  }, [query]);

  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", onGlobalKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onGlobalKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const active = listRef.current.children[activeIndex];
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  function goTo(entry: WikiSearchEntry) {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(entry.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      goTo(results[activeIndex]);
    }
  }

  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative w-full">
      <label htmlFor="wiki-search" className="sr-only">
        Rechercher dans le wiki
      </label>
      <div className="flex items-center gap-3 border border-iron-line bg-iron px-4 py-3 transition-colors focus-within:border-ember motion-reduce:transition-none">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 shrink-0 text-steel"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
        <input
          ref={inputRef}
          id="wiki-search"
          type="search"
          value={query}
          autoComplete="off"
          spellCheck={false}
          placeholder="Rechercher une commande, une mécanique…"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="wiki-search-results"
          aria-activedescendant={
            showDropdown && results[activeIndex]
              ? `wiki-search-option-${activeIndex}`
              : undefined
          }
          className="w-full bg-transparent font-sans text-sm text-bone placeholder:text-steel focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="hidden shrink-0 border border-iron-line bg-ash-deep px-2 py-1 font-tech text-[10px] uppercase tracking-[0.18em] text-steel sm:inline-block">
          {shortcut}
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 border border-iron-line bg-ash-deep shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          {results.length > 0 ? (
            <ul
              ref={listRef}
              id="wiki-search-results"
              role="listbox"
              aria-label="Résultats de recherche"
              className="max-h-80 overflow-y-auto"
            >
              {results.map((entry, index) => (
                <li
                  key={entry.href}
                  id={`wiki-search-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(entry)}
                    className={`flex w-full flex-col gap-1 border-b border-iron-line/40 px-4 py-3 text-left transition-colors motion-reduce:transition-none ${
                      index === activeIndex ? "bg-iron-light" : "bg-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-display text-sm font-semibold text-bone">
                        {entry.title}
                      </span>
                      <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-ember-glow">
                        {entry.categoryName}
                      </span>
                    </span>
                    <span className="line-clamp-1 text-xs leading-relaxed text-steel">
                      {entry.summary}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 text-sm text-steel">
              Aucun article ne correspond à cette recherche.
            </p>
          )}
          <p className="border-t border-iron-line/40 px-4 py-2 font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
            Flèches pour naviguer — Entrée pour ouvrir — Échap pour fermer
          </p>
        </div>
      )}
    </div>
  );
}
