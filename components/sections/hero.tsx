"use client";

import { motion, useAnimationControls } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { containerVariants, EASE, itemVariants } from "@/lib/animations";
import { ENQUIRY_FOCUS_EVENT, ENQUIRY_ID } from "@/lib/constants";
import heroBg from "@/public/gallery/sports-field.jpg";
import EnquiryForm from "../enquiry-form";

const STATS: { value: string; prefix?: string; accent?: string; label: string }[] = [
  { value: "1931", label: "Established" },
  { value: "1", prefix: "#", label: "Vintage School in Karnataka" },
  { value: "CBSE", label: "Affiliated curriculum" },
];

export default function Hero() {
  const formControls = useAnimationControls();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animation.
    formControls.start({ opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } });

    const rest = "0 30px 70px -25px rgba(0,0,0,0.55)";
    const pop = () => {
      formControls.start({
        scale: [1, 1.04, 1],
        boxShadow: [
          `${rest}, 0 0 0 0 rgba(217,72,30,0)`,
          `${rest}, 0 0 0 6px rgba(217,72,30,0.35)`,
          `${rest}, 0 0 0 0 rgba(217,72,30,0)`,
        ],
        transition: { duration: 0.7, ease: EASE },
      });
    };

    // Triggered by either Enroll Now button (navbar or footer). Scroll to the
    // form, then pop only once the scroll has actually settled on the hero —
    // so the user always sees the animation, however far they scrolled from.
    const onFocus = () => {
      const el = formRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const alreadyOnScreen = rect.top >= 0 && rect.top < window.innerHeight * 0.5;

      el.scrollIntoView({ behavior: "smooth", block: "start" });

      if (alreadyOnScreen) {
        window.setTimeout(pop, 150);
        return;
      }

      let done = false;
      let fallback = 0;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener("scrollend", finish);
        window.clearTimeout(fallback);
        pop();
      };
      // `scrollend` fires when the smooth scroll stops (modern browsers);
      // the timeout is a fallback for browsers without it (e.g. Safari).
      window.addEventListener("scrollend", finish);
      fallback = window.setTimeout(finish, 1200);
    };

    window.addEventListener(ENQUIRY_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(ENQUIRY_FOCUS_EVENT, onFocus);
  }, [formControls]);

  return (
    <section
      id="top"
      className="relative z-10 overflow-hidden bg-ink pb-28 pt-28 sm:pb-36 sm:pt-32 lg:pt-32"
    >
      {/* Background image + premium overlays */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={heroBg}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="hero-zoom object-cover object-center"
        />
        {/* Left-weighted scrim so the white copy stays legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/30" />
        {/* Gentle top/bottom depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
        {/* Fade into the page background so it flows into the video below */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-bg sm:h-36" />
      </div>

      <div className="relative z-10 mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12 xl:gap-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col text-left"
          >
            <motion.h1
              variants={itemVariants}
              className="max-w-2xl font-display text-h2 text-white drop-shadow-sm"
            >
              A CBSE school rooted in Bangalore for generations.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-ivory/85 sm:mt-6 sm:text-[1.05rem]"
            >
              Tucked in Vasanth Nagar, in the shade of trees older than the city&apos;s skyline,
              SKEI has been a place of quiet, deliberate education for decades. Our CBSE curriculum,
              from Nursery through Grade 10, is taught not as a race to results but as an invitation
              to think, question, and discover.
            </motion.p>

            <motion.dl
              variants={itemVariants}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-5 sm:mt-10 sm:gap-x-10"
            >
              {STATS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                  <div className="flex flex-col">
                    <dt className="font-display text-3xl leading-none tracking-tight text-white sm:text-4xl lg:text-5xl">
                      {s.prefix && <span className="text-clay">{s.prefix}</span>}
                      {s.value}
                      {s.accent && <span className="text-clay">{s.accent}</span>}
                    </dt>
                    <dd className="mt-2 text-[0.7rem] font-semibold uppercase tracking-wider text-ivory/70">
                      {s.label}
                    </dd>
                  </div>
                  {i < STATS.length - 1 && (
                    <span className="hidden h-11 w-px bg-white/25 sm:block" aria-hidden />
                  )}
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <motion.div
            ref={formRef}
            id={ENQUIRY_ID}
            initial={{ opacity: 0, x: 30 }}
            animate={formControls}
            className="mx-auto w-full max-w-lg scroll-mt-28 rounded-2xl shadow-[0_30px_70px_-25px_rgba(0,0,0,0.55)] lg:-mt-10 lg:mr-0"
          >
            <EnquiryForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
