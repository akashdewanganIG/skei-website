"use client";

import { useState, useEffect } from "react";
import { SCROLL_THRESHOLD } from "@/lib/constants";

export function useScrollState(threshold = SCROLL_THRESHOLD) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > threshold);
      // Hide when scrolling down past the threshold, reveal when scrolling up.
      if (y > lastY && y > threshold) {
        setHidden(true);
      } else if (y < lastY) {
        setHidden(false);
      }
      lastY = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { scrolled, hidden };
}
