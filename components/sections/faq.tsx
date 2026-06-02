"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "../reveal";

import { FAQS } from "../../data/faq";
import { EASE } from "@/lib/animations";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="bg-bg relative z-20 pt-9 pb-24 sm:pt-12 sm:pb-32 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)]"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="flex flex-col items-center text-center">
          <div className="mb-4 text-eyebrow text-clay">Support</div>
          <h2 className="text-h2 text-fg">Frequently Asked Questions</h2>
          <p className="mt-3 max-w-3xl text-[1.05rem] text-muted text-balance">
            Quick answers to common questions about admissions, academics, and campus life.
          </p>
        </Reveal>

        <div className="mt-12 divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-6 py-5 text-left transition-colors"
                >
                  <span
                    className={`font-display text-lg sm:text-xl transition-colors duration-200 ${isOpen ? "text-clay" : "text-fg group-hover:text-clay"}`}
                  >
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                      isOpen
                        ? "border-clay bg-clay text-white shadow-sm"
                        : "border-line text-fg group-hover:border-clay/50 group-hover:text-clay"
                    }`}
                    aria-hidden
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1v12M1 7h12"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-12 text-base leading-relaxed text-fg/70">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
