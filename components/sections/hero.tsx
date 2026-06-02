"use client";

import { motion } from "framer-motion";
import EnquiryForm from "../enquiry-form";
import { EASE, containerVariants, itemVariants } from "@/lib/animations";
import { ENQUIRY_ID } from "@/lib/constants";

const STATS: { value: string; prefix?: string; accent?: string; label: string }[] = [
  { value: "1931", label: "Established" },
  { value: "1", prefix: "#", label: "Vintage School in Karnataka" },
  { value: "CBSE", label: "Affiliated curriculum" },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative z-10 overflow-hidden bg-bg pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pt-32"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12 xl:gap-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col text-left lg:pt-24"
          >
            <motion.h1
              variants={itemVariants}
              className="max-w-2xl font-display text-4xl leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl"
            >
              A CBSE school where learning itself is the goal.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-xl text-base leading-relaxed text-balance text-muted sm:mt-6 sm:text-[1.05rem]"
            >
              Set in the heart of Bangalore, shaded by 100-year-old trees, SKEI pairs a rigorous
              CBSE curriculum with hands-on, whole-child learning.
            </motion.p>

            <motion.dl
              variants={itemVariants}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-5 sm:mt-10 sm:gap-x-10"
            >
              {STATS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                  <div className="flex flex-col">
                    <dt className="font-display text-3xl leading-none tracking-tight text-fg sm:text-4xl lg:text-5xl">
                      {s.prefix && <span className="text-clay">{s.prefix}</span>}
                      {s.value}
                      {s.accent && <span className="text-clay">{s.accent}</span>}
                    </dt>
                    <dd className="mt-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted/80">
                      {s.label}
                    </dd>
                  </div>
                  {i < STATS.length - 1 && (
                    <span className="hidden h-11 w-px bg-line/80 sm:block" aria-hidden />
                  )}
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <motion.div
            id={ENQUIRY_ID}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mx-auto w-full max-w-lg scroll-mt-28 lg:mr-0 lg:-mt-6"
          >
            <EnquiryForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
