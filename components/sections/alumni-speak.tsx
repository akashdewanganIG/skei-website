"use client";

import Image from "next/image";
import { RiDoubleQuotesL } from "@remixicon/react";

import type { Quote } from "../../types/alumni-speak";
import { QUOTES } from "../../data/alumni-speak";

const COL_1 = [...QUOTES, ...QUOTES, ...QUOTES];
const COL_2 = [...QUOTES]
  .reverse()
  .concat([...QUOTES].reverse())
  .concat([...QUOTES].reverse());
const COL_3 = [
  ...QUOTES.slice(3),
  ...QUOTES.slice(0, 3),
  ...QUOTES.slice(3),
  ...QUOTES.slice(0, 3),
  ...QUOTES,
];

function getInitials(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AlumniSpeakCard({ q }: { q: Quote }) {
  return (
    <figure className="flex h-fit w-full flex-col rounded-3xl bg-surface p-6 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.3)] ring-1 ring-fg/5 transition-all hover:-translate-y-1 hover:shadow-[0_24px_55px_-14px_rgba(0,0,0,0.42)] sm:p-7">
      <div className="mb-4 text-clay/40">
        <RiDoubleQuotesL className="h-7 w-7" />
      </div>
      <blockquote className="mb-6 flex-1 space-y-2">
        {q.quote.map((para, i) => (
          <p
            key={i}
            className="font-serif text-sm italic leading-relaxed text-fg/90 sm:text-[0.95rem]"
          >
            {para}
          </p>
        ))}
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay/10">
          {q.avatar ? (
            <Image src={q.avatar} alt={q.name} fill className="object-cover" sizes="40px" />
          ) : (
            <span className="font-display text-sm font-semibold text-clay">
              {getInitials(q.name)}
            </span>
          )}
        </div>
        <div className="text-left leading-tight">
          <span className="block text-[0.85rem] font-semibold text-fg">{q.name}</span>
          <span className="mt-0.5 block text-[0.7rem] text-muted">{q.role}</span>
        </div>
      </figcaption>
    </figure>
  );
}

export default function AlumniSpeak() {
  return (
    <section
      id="alumni-speak"
      className="pb-16 sm:pb-20 pt-24 sm:pt-32 mt-[-3rem] sm:mt-[-4rem] bg-clay overflow-hidden relative z-0"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid h-[800px] max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-8 [animation:marquee-up_35s_linear_infinite] hover:[animation-play-state:paused]">
            {COL_1.map((q, i) => (
              <AlumniSpeakCard key={`col1-${i}`} q={q} />
            ))}
          </div>

          <div className="hidden flex-col gap-8 [animation:marquee-down_40s_linear_infinite] hover:[animation-play-state:paused] sm:flex">
            {COL_2.map((q, i) => (
              <AlumniSpeakCard key={`col2-${i}`} q={q} />
            ))}
          </div>

          <div className="hidden flex-col gap-8 [animation:marquee-up_45s_linear_infinite] hover:[animation-play-state:paused] lg:flex">
            {COL_3.map((q, i) => (
              <AlumniSpeakCard key={`col3-${i}`} q={q} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
