"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "./Reveal";

import assembly1 from "../public/gallery/assembly.jpg";
import assembly2 from "../public/gallery/assembly 2.jpg";
import books from "../public/gallery/books.jpg";
import causeact from "../public/gallery/causeact.jpg";
import classImg from "../public/gallery/class.jpg";
import computerlab from "../public/gallery/computerlab.jpg";
import library from "../public/gallery/library.jpg";

const IMAGES = [
  { src: assembly1, alt: "Morning Assembly" },
  { src: assembly2, alt: "Students at Assembly" },
  { src: books, alt: "Library Books" },
  { src: causeact, alt: "Cause and Act Program" },
  { src: classImg, alt: "Classroom Activity" },
  { src: computerlab, alt: "Computer Lab" },
  { src: library, alt: "School Library" },
];

const BLUR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Generates a unique but stable scatter transform for every card index,
 * so the pattern never visibly repeats across rows.
 */
function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function generateScatter(index: number) {
  const r1 = seededRandom(index * 17 + 3);
  const r2 = seededRandom(index * 31 + 7);
  const r3 = seededRandom(index * 53 + 11);

  // Rotation: -7deg to +7deg
  const rotate = (r1 - 0.5) * 14;
  // Vertical offset: -30px to +30px (creates minor row overlap)
  const translateY = (r2 - 0.5) * 60;
  // Horizontal jitter: -8px to +8px
  const translateX = (r3 - 0.5) * 16;

  return { rotate, translateY, translateX };
}

export default function Gallery() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visibleImages = showAll ? IMAGES : IMAGES.slice(0, 5);

  // Pre-compute unique scatter values for every image (stable across renders)
  const scatterValues = useMemo(
    () => IMAGES.map((_, i) => generateScatter(i)),
    []
  );

  return (
    <section
      id="gallery"
      className="relative z-30 overflow-hidden bg-ivory pb-32 pt-24 sm:pb-40 sm:pt-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 text-eyebrow text-clay">Gallery</div>
          <h2 className="text-h2 text-ink">Around the School</h2>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted sm:text-[1.05rem]">
            A glimpse into the vibrant environment where learning, play, and
            growth happen every day.
          </p>
        </Reveal>

        {/* ── Desktop: overlapping scattered cards ── */}
        <div className="hidden justify-center pb-24 pt-10 lg:flex">
          <div className="mx-auto flex max-w-[72rem] flex-row flex-wrap items-center justify-center gap-y-4 px-8 -space-x-8">
            {IMAGES.map((img, i) => {
              const active = hovered === i;
              const s = scatterValues[i];

              // Only nudge the immediate neighbors (the ones actually overlapping)
              const isLeftNeighbor = hovered !== null && i === hovered - 1;
              const isRightNeighbor = hovered !== null && i === hovered + 1;

              let animateTarget;
              if (active) {
                animateTarget = { rotate: 0, x: 0, y: -16, scale: 1.08 };
              } else if (isLeftNeighbor) {
                animateTarget = {
                  rotate: s.rotate,
                  x: s.translateX - 24,
                  y: s.translateY,
                  scale: 1,
                };
              } else if (isRightNeighbor) {
                animateTarget = {
                  rotate: s.rotate,
                  x: s.translateX + 24,
                  y: s.translateY,
                  scale: 1,
                };
              } else {
                animateTarget = {
                  rotate: s.rotate,
                  x: s.translateX,
                  y: s.translateY,
                  scale: 1,
                };
              }

              return (
                <motion.div
                  key={i}
                  className="relative w-[380px] shrink-0 cursor-pointer"
                  style={{
                    zIndex: active ? 50 : 10 + i,
                    boxShadow: active
                      ? "0 20px 50px rgba(30,27,23,0.3)"
                      : "0 8px 24px rgba(30,27,23,0.1)",
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{
                    // Entrance stagger only applies to opacity
                    opacity: { duration: 0.6, delay: i * 0.1, ease: [0.2, 0, 0, 1] },
                    // Everything else (hover transforms) is instant
                    default: { duration: 0.4, ease: [0.2, 0, 0, 1] },
                  }}
                  animate={animateTarget}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    placeholder="blur"
                    blurDataURL={BLUR}
                    className="h-auto w-full"
                    sizes="400px"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile: vertical stack with show-more ── */}
        <div className="flex flex-col gap-10 lg:hidden">
          <AnimatePresence>
            {visibleImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full shadow-card"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  placeholder="blur"
                  blurDataURL={BLUR}
                  className="h-auto w-full"
                  sizes="100vw"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {IMAGES.length > 5 && (
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
