"use client";

import { Stagger, StaggerItem } from "./Reveal";

const ITEMS = [
  { k: "CBSE", v: "Affiliated curriculum" },
  { k: "NEP 2020", v: "Aligned pedagogy" },
  { k: "40+", v: "Clubs & activities" },
  { k: "15 acre", v: "Green campus" },
];

export default function TrustStrip() {
  return (
    <section aria-label="At a glance">
      <Stagger
        className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4"
        as="div"
      >
        {ITEMS.map((it) => (
          <StaggerItem key={it.k}>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="font-display text-2xl text-ink/90 sm:text-3xl [text-shadow:0_1.5px_0_rgba(255,255,255,0.8)]">{it.k}</span>
              <span className="mt-1 text-sm font-medium text-muted/90 [text-shadow:0_1px_0_rgba(255,255,255,0.6)]">{it.v}</span>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
