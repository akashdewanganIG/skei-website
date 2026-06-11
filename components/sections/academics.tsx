"use client";

import { RiArrowRightLine } from "@remixicon/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { EASE } from "@/lib/animations";
import { PROGRAMS } from "../../data/academics";
import { Reveal } from "../reveal";

export default function Academics() {
  return (
    <section id="academics" className="relative z-30 bg-bg pt-9 pb-18 sm:pt-12 sm:pb-24">
      <div className="mx-auto max-w-[93rem] px-4 sm:px-6 lg:px-8">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PROGRAMS.map((p) => {
              const Icon = p.icon;

              return (
                <motion.article
                  key={p.title}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                  className="group relative flex h-full overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-line/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-lift hover:ring-clay/30"
                >
                  {/* Left — content */}
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay/10">
                      <Icon className="h-[1.35rem] w-[1.35rem] stroke-[1.5] text-clay" />
                    </div>

                    <div className="mt-5 text-[0.66rem] font-bold uppercase tracking-widest text-clay">
                      {p.subtitle}
                    </div>
                    <h3 className="mt-1 font-display text-[1.4rem] leading-[1.1] tracking-tight text-fg transition-colors duration-300 group-hover:text-clay">
                      {p.title}
                    </h3>
                    <p className="mt-2.5 text-[0.83rem] leading-[1.5] text-muted/90">{p.desc}</p>

                    <a
                      href="#top"
                      className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[0.85rem] font-semibold text-clay transition-colors hover:text-clay-deep"
                    >
                      Explore Program
                      <RiArrowRightLine className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </div>

                  {/* Right — tinted illustration panel (tint is baked into the art) */}
                  <div className="relative w-[40%] shrink-0 self-stretch bg-[#fcebdd]">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
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
