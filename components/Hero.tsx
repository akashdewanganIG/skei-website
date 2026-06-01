"use client";

import { motion } from "framer-motion";
import EnquiryForm from "./EnquiryForm";

const EASE = [0.2, 0, 0, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const STATS = [
  { value: "94", accent: "+", label: "Years of legacy" },
  { value: "100", accent: "%", label: "Board pass rate" },
  { value: "1:25", accent: "", label: "Class strength" },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative z-10 overflow-hidden bg-ivory pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pt-36"
    >


      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12 xl:gap-20">

          {/* Left Column: Content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col text-left"
          >


            <motion.h1
              variants={item}
              className="font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl"
            >
              Empowering students for a brighter future.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-4 max-w-3xl text-base text-balance text-muted sm:mt-6 sm:text-[1.05rem]"
            >
              SKEI provides a rigorous CBSE curriculum combined with hands-on, real-world learning to prepare students for the future.
            </motion.p>

            {/* Trust stats — Lora numerals with clay accents, matching LegacyStats */}
            <motion.dl
              variants={item}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-5 sm:mt-10 sm:gap-x-10"
            >
              {STATS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                  <div className="flex flex-col">
                    <dt className="font-display text-3xl tracking-tight text-ink sm:text-4xl lg:text-5xl">
                      {s.value}
                      {s.accent && <span className="text-clay">{s.accent}</span>}
                    </dt>
                    <dd className="mt-1 text-xs font-medium text-muted sm:text-sm">{s.label}</dd>
                  </div>
                  {i < STATS.length - 1 && (
                    <span className="hidden h-10 w-px bg-line sm:block sm:h-12" aria-hidden />
                  )}
                </div>
              ))}
            </motion.dl>


          </motion.div>

          {/* Right Column: Admission Form — white card matching Testimonials' card idiom */}
          <motion.div
            id="enquiry"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mx-auto w-full max-w-lg scroll-mt-28 lg:mx-0"
          >
            <EnquiryForm />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
