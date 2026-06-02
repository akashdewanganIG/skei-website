"use client";

import { useState, useEffect } from "react";
import { SCROLL_THRESHOLD } from "@/lib/constants";

export function useScrollState(threshold = SCROLL_THRESHOLD) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { scrolled };
}
