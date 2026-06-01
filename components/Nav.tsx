"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RiMenu3Line, RiCloseLine } from "@remixicon/react";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";

import { NAV_LINKS } from "../data/nav";

function Logo() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="flex cursor-pointer items-center pr-2 transition-opacity hover:opacity-80"
      aria-label="SKEI home"
    >
      <div className="relative h-[32px] w-[115px] sm:h-[34px] sm:w-[125px]">
        <Image
          src="/logo.png"
          alt="Best CBSE School in Bangalore - SKEI Admissions"
          fill
          className="object-contain object-left"
          sizes="125px"
          priority
        />
      </div>
    </button>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // React 18+ automatically batches these and ignores them if the boolean hasn't changed,
      // making this highly performant without needing an external throttle/debounce function.
      setScrolled(window.scrollY > 20);
      setShowApply(window.scrollY > 400);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Extracted scroll handler to keep JSX clean and avoid inline function creation on every render
  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false); // Auto-close mobile menu if open
  }, []);

  return (
    <header className="pointer-events-none fixed left-0 top-0 z-50 flex w-full justify-center">
      <div className="relative w-full">
        {/* Full-width Navbar */}
        <div
          className={`pointer-events-auto flex w-full items-center justify-center transition-all duration-500 ${
            scrolled
              ? "border-b border-line/50 bg-white/80 py-3 shadow-[0_1px_12px_rgba(30,27,23,0.06)] backdrop-blur-xl sm:py-3.5"
              : "border-b border-transparent bg-white/40 py-4 backdrop-blur-sm sm:bg-transparent sm:py-5 sm:backdrop-blur-none"
          }`}
        >
          <div className="grid w-full max-w-[90rem] grid-cols-2 items-center px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <div className="flex justify-start">
              <Logo />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden justify-center lg:flex">
              <ul className="flex items-center gap-1">
                {NAV_LINKS.map((link, i) => (
                  <li key={link.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => scrollToSection(link.id)}
                      className="group relative cursor-pointer px-4 py-2 text-[0.88rem] font-medium tracking-wide text-ink/60 transition-colors duration-300 hover:text-ink"
                    >
                      {link.label}
                      {/* Animated underline */}
                      <span className="absolute bottom-0.5 left-4 right-4 h-[1.5px] origin-left scale-x-0 bg-clay transition-transform duration-300 group-hover:scale-x-100" />
                    </button>
                    {/* Dot separator */}
                    {i < NAV_LINKS.length - 1 && (
                      <span className="mx-1 h-[3px] w-[3px] rounded-full bg-line/60" />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center justify-end gap-3">
              <AnimatePresence>
                {showApply && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button
                      type="button"
                      onClick={() => scrollToSection("enquiry")}
                      className="group flex cursor-pointer items-center justify-center rounded-full bg-clay px-5 py-2 text-[0.85rem] font-semibold tracking-wide text-white shadow-soft transition-all duration-300 hover:-translate-y-[1px] hover:bg-clay-deep hover:shadow-md active:translate-y-0 sm:px-6 sm:text-[0.88rem]"
                    >
                      Apply Now
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="lg:hidden">
                <button
                  type="button"
                  className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-ink/70 transition-all hover:bg-line/20 hover:text-ink"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  {menuOpen ? (
                    <RiCloseLine className="h-5 w-5" aria-hidden />
                  ) : (
                    <RiMenu3Line className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
              exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
              className="pointer-events-auto absolute left-0 right-0 top-full w-full origin-top border-b border-line bg-ivory/95 shadow-md backdrop-blur-md lg:hidden"
            >
              <div className="px-4 py-6 sm:px-6">
                <motion.ul
                  className="flex flex-col gap-2"
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                  }}
                >
                  {NAV_LINKS.map((link) => (
                    <motion.li
                      key={link.id}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0 } },
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => scrollToSection(link.id)}
                        className="group flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-left text-[0.95rem] font-medium text-ink transition-all hover:bg-clay hover:text-white sm:text-base"
                      >
                        {link.label}
                        <svg
                          className="h-5 w-5 -translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    </motion.li>
                  ))}

                  {/* Show Apply button in menu if not scrolled enough to show it in navbar */}
                  {!showApply && (
                    <motion.li
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0 } },
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => scrollToSection("enquiry")}
                        className="mt-2 w-full rounded-2xl bg-clay px-5 py-3 text-center text-[0.95rem] font-semibold text-white shadow-soft transition-all active:scale-95 sm:text-base"
                      >
                        Apply Now
                      </button>
                    </motion.li>
                  )}
                </motion.ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}