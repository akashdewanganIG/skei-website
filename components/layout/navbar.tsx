"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RiMenu3Line, RiCloseLine } from "@remixicon/react";
import Image from "next/image";
import { useState, useCallback } from "react";
import { useScrollState } from "../../hooks/use-scroll-state";
import { NAV_LINKS } from "../../data/nav";
import { EASE } from "@/lib/animations";
import { ENQUIRY_ID } from "@/lib/constants";
import { scrollToId } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

function Logo() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="flex cursor-pointer items-center transition-opacity hover:opacity-80"
      aria-label="SKEI home"
    >
      <Image
        src="/logo.png"
        alt="Best CBSE School in Bangalore - SKEI Admissions"
        width={0}
        height={0}
        sizes="125px"
        priority
        className="h-[32px] w-auto sm:h-[34px]"
      />
    </button>
  );
}

export default function Navbar() {
  const { scrolled } = useScrollState();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = useCallback((id: string) => {
    scrollToId(id);
    setMenuOpen(false);
  }, []);

  const solid = scrolled || menuOpen;
  const bar = `pointer-events-auto rounded-xl transition-[background-color,box-shadow] duration-200 ${
    solid ? "bg-surface shadow-soft ring-1 ring-fg/5" : "bg-transparent"
  }`;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-[90rem] px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className={`${bar} flex flex-col overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 py-1.5 pl-4 pr-1.5 sm:pl-5">
            <Logo />

            <div className="flex items-center gap-1">
              <ul className="hidden items-center lg:flex">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => goTo(link.id)}
                      className="cursor-pointer rounded-md px-3.5 py-2 text-[0.9rem] font-medium text-fg/70 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-fg"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>

              <ThemeToggle />

              <button
                type="button"
                onClick={() => goTo(ENQUIRY_ID)}
                className="ml-1 hidden cursor-pointer items-center justify-center rounded-md bg-clay px-5 py-2.5 text-[0.85rem] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-[1px] hover:bg-clay-deep active:translate-y-0 lg:flex"
              >
                Enroll Now
              </button>

              <button
                type="button"
                onClick={() => goTo(ENQUIRY_ID)}
                className="cursor-pointer rounded-md bg-clay px-4 py-2 text-[0.85rem] font-semibold text-white shadow-soft transition-colors hover:bg-clay-deep lg:hidden"
              >
                Enroll
              </button>
              <button
                type="button"
                className="relative grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg text-fg/80 transition-colors hover:bg-fg/10 lg:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <motion.span
                  animate={{ rotate: menuOpen ? 90 : 0, opacity: menuOpen ? 0 : 1 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="absolute inset-0 grid place-items-center"
                >
                  <RiMenu3Line className="h-5 w-5" aria-hidden />
                </motion.span>
                <motion.span
                  animate={{ rotate: menuOpen ? 0 : -90, opacity: menuOpen ? 1 : 0 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="absolute inset-0 grid place-items-center"
                >
                  <RiCloseLine className="h-5 w-5" aria-hidden />
                </motion.span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="panel"
                id="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="overflow-hidden lg:hidden"
              >
                <div className="mx-1.5 mb-1.5 h-px bg-fg/10" />
                <ul className="flex flex-col gap-0.5 px-1.5 pb-1.5">
                  {NAV_LINKS.map((link) => (
                    <li key={link.id}>
                      <button
                        type="button"
                        onClick={() => goTo(link.id)}
                        className="w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-[0.8rem] font-medium text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
