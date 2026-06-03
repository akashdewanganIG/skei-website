"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { RiDoubleQuotesL, RiCloseLine } from "@remixicon/react";

import type { Quote } from "../../types/alumni-speak";
import { QUOTES } from "../../data/alumni-speak";
import { EASE } from "@/lib/animations";

function getInitials(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ q, size, ring }: { q: Quote; size: number; ring?: boolean }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay/10 ${
        ring ? "ring-4 ring-clay/10" : "ring-1 ring-fg/10"
      }`}
      style={{ height: size, width: size }}
    >
      {q.avatar ? (
        <Image src={q.avatar} alt={q.name} fill className="object-cover" sizes={`${size}px`} />
      ) : (
        <span className="font-display text-lg font-semibold text-clay">{getInitials(q.name)}</span>
      )}
    </div>
  );
}

function AlumniCard({ q, onClick }: { q: Quote; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full w-full flex-col items-center overflow-hidden rounded-3xl bg-surface p-5 text-center ring-1 ring-fg/5 transition-all duration-300 hover:-translate-y-1.5 hover:ring-clay/20 sm:p-6"
      style={{ boxShadow: "0 14px 38px -18px rgba(0,0,0,0.4)" }}
    >
      {/* warm wash that lifts on hover */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-clay/[0.06] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Avatar q={q} size={96} ring />

      <h3 className="mt-5 font-display text-[1.05rem] leading-tight text-fg">{q.name}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-[0.78rem] leading-relaxed text-muted">{q.role}</p>

      <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-clay/10 px-3.5 py-1.5 text-[0.74rem] font-semibold text-clay transition-colors duration-300 group-hover:bg-clay group-hover:text-ivory">
        <RiDoubleQuotesL className="h-3.5 w-3.5 shrink-0" />
        Read message
      </span>
    </button>
  );
}

function QuoteModal({ q, onClose }: { q: Quote; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    // Lock page scroll while the modal is open, then restore it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Message from ${q.name}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <RiDoubleQuotesL className="h-9 w-9 text-clay/40" />
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg"
            aria-label="Close"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <blockquote className="mt-3 space-y-3">
          {q.quote.map((para) => (
            <p key={para} className="font-serif text-[0.95rem] italic leading-relaxed text-fg/90">
              {para}
            </p>
          ))}
        </blockquote>

        <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
          <Avatar q={q} size={48} />
          <div className="text-left leading-tight">
            <span className="block text-sm font-semibold text-fg">{q.name}</span>
            <span className="mt-0.5 block text-[0.78rem] text-muted">{q.role}</span>
          </div>
        </figcaption>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export default function AlumniSpeak() {
  const [active, setActive] = useState<Quote | null>(null);

  return (
    <section
      id="alumni-speak"
      className="relative z-0 mt-[-3rem] overflow-hidden bg-clay pb-20 pt-28 sm:mt-[-4rem] sm:pb-24 sm:pt-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {QUOTES.map((q) => (
            <AlumniCard key={q.name} q={q} onClick={() => setActive(q)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && <QuoteModal q={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
}
