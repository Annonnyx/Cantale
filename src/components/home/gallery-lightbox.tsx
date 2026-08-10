"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryImage } from "./gallery";

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [current, setCurrent] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setCurrent(null);
    triggerRef.current?.focus();
  }, []);

  const previous = useCallback(() => {
    setCurrent((index) => (index === null ? null : (index - 1 + images.length) % images.length));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((index) => (index === null ? null : (index + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (current === null) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [current, close, previous, next]);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setCurrent(index);
              }}
              aria-label={`Agrandir la capture : ${image.alt}`}
              className="group relative block aspect-video w-full overflow-hidden border border-iron-line/60 bg-iron"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {current !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Capture agrandie : ${images[current].alt}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ash-deep/95 p-4 backdrop-blur-sm sm:p-10"
          onClick={close}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Fermer la visionneuse"
            className="pressable absolute right-4 top-4 flex h-11 w-11 items-center justify-center border border-iron-line bg-ash/70 text-bone hover:border-ember hover:text-bone sm:right-6 sm:top-6"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              previous();
            }}
            aria-label="Image précédente"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-iron-line bg-ash/70 text-bone transition-colors hover:border-ember hover:text-bone sm:left-6"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 2L4 8l6 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
            aria-label="Image suivante"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-iron-line bg-ash/70 text-bone transition-colors hover:border-ember hover:text-bone sm:right-6"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2l6 6-6 6" />
            </svg>
          </button>

          <figure
            className="relative flex h-full w-full flex-col items-center justify-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="relative h-full max-h-[80vh] w-full">
              <Image
                src={images[current].src}
                alt={images[current].alt}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </span>
            <figcaption className="flex items-center gap-4 font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light">
              <span>{images[current].alt}</span>
              <span className="text-ember-glow">
                {current + 1} / {images.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
