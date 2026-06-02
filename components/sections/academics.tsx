"use client";

import { motion } from "framer-motion";
import { Reveal } from "../reveal";

import { PROGRAMS } from "../../data/academics";
import { EASE } from "@/lib/animations";

function borderClassFor(i: number) {
  if (i === 0) return "border-b md:border-r lg:border-b-0";
  if (i === 1) return "border-b md:border-r-0 lg:border-r lg:border-b-0";
  if (i === 2) return "border-b md:border-b-0 md:border-r lg:border-b-0";
  return "border-b-0 md:border-r-0 lg:border-b-0";
}

export default function Academics() {
  return (
    <section id="academics" className="relative z-30 bg-bg pt-9 pb-18 sm:pt-12 sm:pb-24">
      <div className="mx-auto max-w-[85rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col items-center text-center">
          <div className="mb-4 text-eyebrow text-clay">Curriculum</div>
          <h2 className="text-h2 text-fg">Academic Programs</h2>
          <p className="mt-4 max-w-2xl text-base text-balance text-muted sm:text-[1.05rem]">
            A progressive journey from early years through secondary education, designed to build
            independence, critical thinking, and a lifelong love for learning.
          </p>
        </Reveal>

        <motion.div
          className="relative mt-20"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
        >
          <div className="grid grid-cols-1 border-y border-dashed border-line md:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                  className={`group relative flex h-full flex-col bg-bg p-8 sm:p-10 border-dashed border-line ${borderClassFor(i)}`}
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-10 top-12 text-line/20 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6 group-hover:text-line/30">
                      <Icon className="h-48 w-48 stroke-[0.5]" />
                    </div>
                  </div>

                  <div className="relative z-10 mb-24 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl bg-clay text-white shadow-sm transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="relative z-10 mt-auto">
                    <div className="mb-2 text-[0.7rem] font-bold tracking-widest uppercase text-clay/80">
                      {p.subtitle}
                    </div>
                    <h3 className="font-display text-[1.75rem] leading-[1.1] tracking-tight text-fg transition-colors duration-300 group-hover:text-clay">
                      {p.title}
                    </h3>
                    <p className="mt-4 min-h-[4.5rem] max-w-[95%] text-[0.95rem] leading-relaxed text-muted/90">
                      {p.desc}
                    </p>
                  </div>

                  {i !== PROGRAMS.length - 1 && (
                    <>
                      <div className="absolute -right-[2.5px] top-[-2.5px] z-20 hidden h-[4px] w-[4px] bg-clay lg:block" />
                      <div className="absolute -bottom-[2.5px] -right-[2.5px] z-20 hidden h-[4px] w-[4px] bg-clay lg:block" />
                    </>
                  )}
                  {i === 0 && (
                    <>
                      <div className="absolute -right-[2.5px] top-[-2.5px] z-20 hidden h-[4px] w-[4px] bg-clay md:block lg:hidden" />
                      <div className="absolute -bottom-[2.5px] -right-[2.5px] z-20 hidden h-[4px] w-[4px] bg-clay md:block lg:hidden" />
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
