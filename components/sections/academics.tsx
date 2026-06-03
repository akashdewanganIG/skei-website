"use client";

import { motion } from "framer-motion";
import { Reveal } from "../reveal";

import { PROGRAMS } from "../../data/academics";
import { EASE } from "@/lib/animations";

export default function Academics() {
  return (
    <section id="academics" className="relative z-30 bg-bg pt-9 pb-18 sm:pt-12 sm:pb-24">
      <div className="mx-auto max-w-[85rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col items-center text-center">
          <div className="mb-4 text-eyebrow text-clay">Curriculum</div>
          <h2 className="text-h2 text-fg">A Journey from First Steps to Grade 10</h2>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted sm:text-[1.05rem]">
            As one of the top CBSE schools in Bangalore, SKEI guides every child from preschool and
            nursery through Grade 10, building independence, critical thinking, and a lifelong love
            for learning.
          </p>
        </Reveal>

        <motion.div
          className="relative mt-16 sm:mt-20"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((p) => {
              const Icon = p.icon;
              const BgIcon = p.bgIcon ?? p.icon;

              return (
                <motion.article
                  key={p.title}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                  className="group relative flex h-full flex-col rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-lift hover:ring-clay/30 sm:p-6"
                >
                  {/* Clay header — ambient icon */}
                  <div className="relative h-28 w-full overflow-hidden rounded-xl bg-clay shadow-sm">
                    {/* subtle depth so the clay isn't a flat fill */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] to-black/[0.10]" />
                    {/* ambient decorative icon */}
                    <BgIcon className="pointer-events-none absolute -right-5 -bottom-7 h-36 w-36 stroke-[0.5] text-white/25 blur-[2.5px] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6" />
                  </div>

                  {/* Crisp icon chip — bridges the clay header and the body */}
                  <div className="relative -mt-7 ml-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface shadow-soft ring-1 ring-line/70 transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-clay/40">
                    <Icon className="h-7 w-7 stroke-[1.5] text-clay" />
                  </div>

                  {/* Body */}
                  <div className="mt-4 flex flex-1 flex-col">
                    <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-widest text-clay/80">
                      {p.subtitle}
                    </div>
                    <h3 className="font-display text-[1.6rem] leading-[1.1] tracking-tight text-fg transition-colors duration-300 group-hover:text-clay">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-muted/90">{p.desc}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}