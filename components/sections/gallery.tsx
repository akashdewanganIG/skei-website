"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "../reveal";
import { seededRandom } from "@/lib/utils";
import { EASE } from "@/lib/animations";
import { BLUR_DATA_URL } from "@/lib/constants";

import morningPrayer from "../../public/gallery/morning-prayer.jpg";
import sittingAssembly from "../../public/gallery/sitting-assembly.jpg";
import ongoingClass from "../../public/gallery/ongoing-class.jpg";
import libraryBooks from "../../public/gallery/library-books.jpg";
import kidsLibrary from "../../public/gallery/kids-library.jpg";
import computerLab from "../../public/gallery/computer-lab.jpg";
import chemistryLab from "../../public/gallery/chemistry-lab.jpg";
import biologyModels from "../../public/gallery/biology-models.jpg";
import diyLab from "../../public/gallery/diy-lab.jpg";
import musicalRoom from "../../public/gallery/musical-room.jpg";
import painting from "../../public/gallery/painting.jpg";
import indoorGamesRoom from "../../public/gallery/indoor-games-room.jpg";
import playground from "../../public/gallery/playground.jpg";
import sportsField from "../../public/gallery/sports-field.jpg";
import basketballNet from "../../public/gallery/basketball-net.jpg";
import playingFootball from "../../public/gallery/playing-football.jpg";
import environmentalCause from "../../public/gallery/enviromental-cause.jpg";
import founderStatue from "../../public/gallery/founder-statue.jpg";

const IMAGES = [
  { src: morningPrayer, alt: "Morning Prayer" },
  { src: sittingAssembly, alt: "Students at Assembly" },
  { src: ongoingClass, alt: "Classroom in Session" },
  { src: libraryBooks, alt: "Library Books" },
  { src: kidsLibrary, alt: "Kids' Library" },
  { src: computerLab, alt: "Computer Lab" },
  { src: chemistryLab, alt: "Chemistry Lab" },
  { src: biologyModels, alt: "Biology Models" },
  { src: diyLab, alt: "DIY Lab" },
  { src: musicalRoom, alt: "Musical Room" },
  { src: painting, alt: "Painting Class" },
  { src: indoorGamesRoom, alt: "Indoor Games Room" },
  { src: playground, alt: "Playground" },
  { src: sportsField, alt: "Sports Field" },
  { src: basketballNet, alt: "Basketball Court" },
  { src: playingFootball, alt: "Playing Football" },
  { src: environmentalCause, alt: "Environmental Cause" },
  { src: founderStatue, alt: "Our Founder's Statue" },
];

const MOBILE_VISIBLE_COUNT = 5;
const HOVER_SCALE = 1.15;
const CLEAR_MARGIN = 6;

const COLS = 4;
const ROW_GAP = 320; // vertical distance between rows (px)
const TOP_OFFSET = 70; // keeps the jittered first row off the top edge (px)
const CARD_CHROME = 44; // padding + caption rendered around each image (px)
const BOTTOM_BUFFER = 48; // breathing room + hover lift allowance (px)

type Nudge = { x: number; y: number; r: number };
const NO_NUDGE: Nudge = { x: 0, y: 0, r: 0 };
const RESET_NUDGES: Nudge[] = IMAGES.map(() => NO_NUDGE);

function generateLayout(index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const cellW = 100 / COLS;

  const r1 = seededRandom(index * 17 + 3);
  const r2 = seededRandom(index * 31 + 7);
  const r3 = seededRandom(index * 53 + 11);
  const r4 = seededRandom(index * 71 + 13);

  const left = col * cellW + (r1 - 0.5) * cellW * 0.8;
  const top = TOP_OFFSET + row * ROW_GAP + (r2 - 0.5) * ROW_GAP * 0.4;
  const rotate = (r3 - 0.5) * 24;
  const width = 260 + r4 * 100;

  return { left: `${left}%`, top, rotate, width };
}

export default function Gallery() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [nudges, setNudges] = useState<Nudge[]>(RESET_NUDGES);
  const [inView, setInView] = useState<boolean[]>(() => IMAGES.map(() => false));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Resting geometry of every card, captured once while nothing is hovered.
  // Using this snapshot (instead of live rects) keeps overlap detection correct
  // even when moving directly between two overlapping cards mid-animation.
  const baseRectsRef = useRef<(DOMRect | null)[]>([]);

  useEffect(() => {
    function invalidate() {
      baseRectsRef.current = [];
      setHovered(null);
      setNudges(RESET_NUDGES);
    }
    window.addEventListener("resize", invalidate);
    return () => window.removeEventListener("resize", invalidate);
  }, []);

  const visibleImages = showAll ? IMAGES : IMAGES.slice(0, MOBILE_VISIBLE_COUNT);
  const layouts = useMemo(() => IMAGES.map((_, i) => generateLayout(i)), []);

  // Size the canvas to its tallest card so nothing is clipped, however many
  // images the gallery holds. Rendered height = card width × intrinsic ratio.
  const containerHeight = useMemo(
    () =>
      IMAGES.reduce((max, img, i) => {
        const { top, width } = layouts[i];
        const renderedHeight = width * (img.src.height / img.src.width);
        return Math.max(max, top + renderedHeight + CARD_CHROME);
      }, 0) + BOTTOM_BUFFER,
    [layouts],
  );

  function handleHover(i: number) {
    setHovered(i);

    // Capture resting positions on the first hover from the background; reuse
    // that snapshot for chained hovers so we never measure a card mid-spring.
    if (baseRectsRef.current.length === 0) {
      baseRectsRef.current = cardRefs.current.map((el) => el?.getBoundingClientRect() ?? null);
    }
    const rects = baseRectsRef.current;
    const base = rects[i];
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
        const r = rects[j];
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
      className="relative z-30 overflow-hidden bg-bg pb-8 pt-9 sm:pb-12 sm:pt-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 text-eyebrow text-clay">Gallery</div>
          <h2 className="text-h2 text-fg">Around the School</h2>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted sm:text-[1.05rem]">
            A glimpse into daily life at SKEI, a top CBSE school in Bangalore, where learning, play,
            and growth happen every day.
          </p>
        </Reveal>

        <div className="relative hidden lg:block" style={{ height: containerHeight }}>
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
                style={{
                  left: layout.left,
                  top: layout.top,
                  width: layout.width,
                  zIndex: active ? 999 : 10 + i,
                }}
                initial={{ opacity: 0, y: 60, rotate: layout.rotate }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                onViewportEnter={() =>
                  setInView((prev) => {
                    if (prev[i]) return prev;
                    const next = [...prev];
                    next[i] = true;
                    return next;
                  })
                }
                animate={{
                  opacity: inView[i] ? 1 : 0,
                  rotate: active ? 0 : layout.rotate + nudgeR,
                  scale: active ? HOVER_SCALE : 1,
                  x: nudgeX,
                  y: !inView[i] ? 60 : active ? -8 : nudgeY,
                }}
                transition={{
                  opacity: { duration: 0.6, delay: i * 0.08, ease: EASE },
                  x: { type: "spring", stiffness: 320, damping: 34 },
                  y: { type: "spring", stiffness: 320, damping: 34 },
                  rotate: { type: "spring", stiffness: 320, damping: 34 },
                  scale: { duration: 0.45, delay: active ? 0.12 : 0, ease: EASE },
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
                type="button"
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
