"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { RiDoubleQuotesL } from "@remixicon/react";

import { Quote } from "../types/testimonial";
import { QUOTES } from "../data/testimonials";



// Duplicate and shuffle for seamless infinite scroll across multiple columns
const COL_1 = [...QUOTES, ...QUOTES, ...QUOTES];
const COL_2 = [...QUOTES].reverse().concat([...QUOTES].reverse()).concat([...QUOTES].reverse());
const COL_3 = [...QUOTES.slice(3), ...QUOTES.slice(0, 3), ...QUOTES.slice(3), ...QUOTES.slice(0, 3), ...QUOTES];

function getInitials(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TestimonialCard({ q }: { q: Quote }) {
  return (
    <figure className="flex h-fit w-full flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink/5 transition-all hover:shadow-md sm:p-7">
      <div className="mb-4 text-clay/40">
        <RiDoubleQuotesL className="h-7 w-7" />
      </div>
      <blockquote className="mb-6 flex-1 space-y-2">
        {q.quote.map((para, i) => (
          <p key={i} className="font-serif text-sm italic leading-relaxed text-ink/90 sm:text-[0.95rem]">
            {para}
          </p>
        ))}
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay/10">
          {q.avatar ? (
            <Image
              src={q.avatar}
              alt={q.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <span className="font-display text-sm font-semibold text-clay">
              {getInitials(q.name)}
            </span>
          )}
        </div>
        <div className="text-left leading-tight">
          <span className="block text-[0.85rem] font-semibold text-ink">{q.name}</span>
          <span className="mt-0.5 block text-[0.7rem] text-muted">{q.role}</span>
        </div>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="pb-16 sm:pb-20 pt-24 sm:pt-32 mt-[-3rem] sm:mt-[-4rem] bg-clay overflow-hidden relative z-0">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">

        {/* Full-width Vertical Marquee */}
        <div className="h-[800px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative max-w-7xl mx-auto">
          
          {/* Column 1: Scrolling Up */}
          <motion.div
            animate={{ y: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 35 }}
            className="flex flex-col gap-8"
          >
            {COL_1.map((q, i) => (
              <TestimonialCard key={`col1-${i}`} q={q} />
            ))}
          </motion.div>

          {/* Column 2: Scrolling Down */}
          <motion.div
            animate={{ y: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
            className="hidden sm:flex flex-col gap-8"
          >
            {COL_2.map((q, i) => (
              <TestimonialCard key={`col2-${i}`} q={q} />
            ))}
          </motion.div>

          {/* Column 3: Scrolling Up */}
          <motion.div
            animate={{ y: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 45 }}
            className="hidden lg:flex flex-col gap-8"
          >
            {COL_3.map((q, i) => (
              <TestimonialCard key={`col3-${i}`} q={q} />
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
