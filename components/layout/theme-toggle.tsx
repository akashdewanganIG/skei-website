"use client";

import { useEffect, useState } from "react";
import { RiMoonLine, RiSunLine } from "@remixicon/react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync the icon with the theme class set before hydration.
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const apply = () => {
      const next = !root.classList.contains("dark");
      root.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      setDark(next);
    };

    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply);
    } else {
      root.classList.add("theme-transition");
      apply();
      window.setTimeout(() => root.classList.remove("theme-transition"), 450);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-md border border-line bg-transparent text-fg/70 transition-colors hover:bg-fg/[0.06] hover:text-fg"
    >
      {dark ? (
        <RiSunLine className="h-[18px] w-[18px]" aria-hidden />
      ) : (
        <RiMoonLine className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );
}
