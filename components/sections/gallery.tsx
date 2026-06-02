"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "../reveal";
import { seededRandom } from "@/lib/utils";
import { EASE } from "@/lib/animations";
import { BLUR_DATA_URL } from "@/lib/constants";

import assembly1 from "../../public/gallery/assembly.jpg";
import assembly2 from "../../public/gallery/assembly 2.jpg";
import books from "../../public/gallery/books.jpg";
import causeact from "../../public/gallery/causeact.jpg";
import classImg from "../../public/gallery/class.jpg";
import computerlab from "../../public/gallery/computerlab.jpg";
import library from "../../public/gallery/library.jpg";

const IMAGES = [
  { src: assembly1, alt: "Morning Assembly" },
  { src: assembly2, alt: "Students at Assembly" },
  { src: books, alt: "Library Books" },
  { src: causeact, alt: "Cause and Act Program" },
  { src: classImg, alt: "Classroom Activity" },
  { src: computerlab, alt: "Computer Lab" },
  { src: library, alt: "School Library" },
];

const MOBILE_VISIBLE_COUNT = 5;
const HOVER_SCALE = 1.15;
const CLEAR_MARGIN = 6;

type Nudge = { x: number; y: number; r: number };
const NO_NUDGE: Nudge = { x: 0, y: 0, r: 0 };
const RESET_NUDGES: Nudge[] = IMAGES.map(() => NO_NUDGE);

function generateLayout(index: number) {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const cellW = 100 / cols;
  const cellH = 50;

  const r1 = seededRandom(index * 17 + 3);
  const r2 = seededRandom(index * 31 + 7);
  const r3 = seededRandom(index * 53 + 11);
  const r4 = seededRandom(index * 71 + 13);

  const left = col * cellW + (r1 - 0.5) * cellW * 0.8;
  const top = row * cellH + (r2 - 0.5) * cellH * 0.6;
  const rotate = (r3 - 0.5) * 24;
  const width = 260 + r4 * 100;

  return { left: `${left}%`, top: `${top}%`, rotate, width };
}

export default function Gallery() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [nudges, setNudges] = useState<Nudge[]>(RESET_NUDGES);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const visibleImages = showAll ? IMAGES : IMAGES.slice(0, MOBILE_VISIBLE_COUNT);
  const layouts = useMemo(() => IMAGES.map((_, i) => generateLayout(i)), []);

  function handleHover(i: number) {
    setHovered(i);
    const base = cardRefs.current[i]?.getBoundingClientRect();
    if (!base) return;

    const hw = (base.width * HOVER_SCALE) / 2;
    const hh = (base.height * HOVER_SCALE) / 2;
    const hcx = base.left + base.width / 2;
    const hcy = base.top + base.height / 2 - 8;
    const hLeft = hcx - hw;
    const hRight = hcx + hw;
    const hTop = hcy - hh;
    const hBottom = hcy + hh;

    setNudges(
      IMAGES.map((_, j) => {
        if (j <= i) return NO_NUDGE;
        const r = cardRefs.current[j]?.getBoundingClientRect();
        if (!r) return NO_NUDGE;

        const ox = Math.min(hRight, r.right) - Math.max(hLeft, r.left);
        const oy = Math.min(hBottom, r.bottom) - Math.max(hTop, r.top);
        if (ox <= 0 || oy <= 0) return NO_NUDGE;

        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const ra = seededRandom(j * 23 + 5);
        const rb = seededRandom(j * 41 + 9);

        if (ox <= oy) {
          const dir = cx >= hcx ? 1 : -1;
          return { x: dir * (ox + CLEAR_MARGIN), y: (rb - 0.5) * 24, r: (ra - 0.5) * 12 };
        }
        const dir = cy >= hcy ? 1 : -1;
        return { x: (rb - 0.5) * 24, y: dir * (oy + CLEAR_MARGIN), r: (ra - 0.5) * 12 };
      }),
    );
  }

  function clearHover() {
    setHovered(null);
    setNudges(RESET_NUDGES);
  }

  return (
    <section
      id="gallery"
      className="relative z-30 overflow-hidden bg-bg pb-18 pt-9 sm:pb-24 sm:pt-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 text-eyebrow text-clay">Gallery</div>
          <h2 className="text-h2 text-fg">Around the School</h2>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted sm:text-[1.05rem]">
            A glimpse into the vibrant environment where learning, play, and growth happen every
            day.
          </p>
        </Reveal>

        <div className="relative hidden lg:block" style={{ height: "clamp(600px, 50vw, 850px)" }}>
          {IMAGES.map((img, i) => {
            const layout = layouts[i];
            const active = hovered === i;
            const { x: nudgeX, y: nudgeY, r: nudgeR } = nudges[i];

            return (
              <motion.div
                key={img.alt}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute cursor-pointer overflow-hidden rounded-sm"
                style={{ left: layout.left, top: layout.top, width: layout.width, zIndex: 10 + i }}
                initial={{ opacity: 0, y: 60, rotate: layout.rotate }}
                whileInView={{ opacity: 1, y: 0, rotate: layout.rotate }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                animate={{
                  rotate: active ? 0 : layout.rotate + nudgeR,
                  scale: active ? HOVER_SCALE : 1,
                  x: nudgeX,
                  y: active ? -8 : nudgeY,
                }}
                transition={{
                  opacity: { duration: 0.6, delay: i * 0.08, ease: EASE },
                  x: { type: "spring", stiffness: 200, damping: 16 },
                  y: { type: "spring", stiffness: 200, damping: 16 },
                  rotate: { type: "spring", stiffness: 200, damping: 16 },
                  scale: { duration: 0.5, delay: active ? 0.08 : 0, ease: EASE },
                }}
                onMouseEnter={() => handleHover(i)}
                onMouseLeave={clearHover}
              >
                <div
                  className="bg-surface p-2 pb-2 transition-shadow duration-400"
                  style={{
                    boxShadow: active
                      ? "0 25px 60px rgba(30,27,23,0.35), 0 8px 20px rgba(30,27,23,0.15)"
                      : "0 8px 30px rgba(30,27,23,0.12), 0 2px 8px rgba(30,27,23,0.08)",
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="h-auto w-full"
                    sizes="360px"
                  />
                  <p className="mt-2 text-center font-hand text-sm text-muted/70">{img.alt}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-10 lg:hidden">
          <AnimatePresence>
            {visibleImages.map((img) => (
              <motion.div
                key={img.alt}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full"
              >
                <div className="bg-surface p-2 pb-5 shadow-card">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="h-auto w-full"
                    sizes="100vw"
                  />
                  <p className="mt-3 text-center font-hand text-sm text-muted/70">{img.alt}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {IMAGES.length > MOBILE_VISIBLE_COUNT && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[0.95rem] font-medium text-clay underline underline-offset-4 decoration-clay/40 transition-all hover:decoration-clay"
              >
                {showAll ? "Show less" : "Show more photos"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
