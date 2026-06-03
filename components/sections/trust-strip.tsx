"use client";

import { motion } from "framer-motion";
import { RiStarFill } from "@remixicon/react";

const ITEMS = [
  "Best CBSE School in Bangalore",
  "Admissions Open 2026–27",
  "CBSE Affiliated Curriculum",
  "Nursery & Preschool to Grade 10",
  "NEP 2020 Aligned Pedagogy",
  "360° STEAM Learning",
  "Bangalore's Greenest Campus",
  "100-Year-Old Heritage Trees",
];

const LOOP = Array.from({ length: 6 }).flatMap((_, rep) =>
  ITEMS.map((label, idx) => ({ label, key: `${rep}-${idx}` })),
);

function Strip({ reverse, color }: { reverse?: boolean; color: string }) {
  return (
    <div className="absolute left-1/2 top-1/2 w-[120vw] -translate-x-1/2 -translate-y-1/2">
      <div
        className={`overflow-hidden py-3 shadow-lift sm:py-4 ${reverse ? "skew-y-3" : "-skew-y-3"} ${color}`}
      >
        <motion.div
          className="flex w-max items-center gap-6 whitespace-nowrap"
          animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 32 }}
        >
          {LOOP.map((item) => (
            <span
              key={item.key}
              className="flex items-center gap-6 text-sm font-semibold uppercase leading-none tracking-wider sm:text-base"
            >
              {item.label}
              <RiStarFill className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <section aria-label="At a glance" className={`relative z-40 h-32 sm:h-40 ${className}`}>
      <Strip color="bg-clay text-white" />
      <Strip reverse color="bg-ink text-ivory" />
    </section>
  );
}
