"use client";

import Image from "next/image";
import { NAV_LINKS } from "../../data/nav";
import { CONTACT, SOCIALS, ENQUIRY_ID } from "@/lib/constants";
import { scrollToId } from "@/lib/utils";

const ACADEMIC_LINKS = [
  "Early Years (Nursery–Prep)",
  "Primary (Grades 1–5)",
  "Middle (Grades 6–8)",
  "Secondary (Grades 9–10)",
];

const footerLinkClass =
  "w-fit text-left text-[13px] text-ivory/60 transition-colors hover:text-clay";
const footerHeadingClass = "font-display text-base font-semibold text-ivory";

export default function Footer() {
  return (
    <footer className="bg-ink text-ivory rounded-t-[2rem] sm:rounded-t-[3rem] mt-[-3rem] sm:mt-[-4rem] relative z-20 shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)]">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-8">
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="relative h-[48px] w-[180px] mb-2 text-left cursor-pointer transition-opacity hover:opacity-80"
              aria-label="SKEI home"
            >
              <Image
                src="/logo.png"
                alt="Best CBSE School in Bangalore - SKEI Admissions"
                fill
                className="object-contain object-left"
                sizes="180px"
              />
            </button>
            <div className="flex flex-col gap-3 max-w-xs text-[13px] leading-relaxed text-ivory/60">
              <p>
                Smt. Kamalabai Educational Institution (SKEI) is a CBSE day school in Bangalore,
                from Nursery to Grade 10, founded by the VST Group.
              </p>
              <p>
                A green, heritage campus shaded by century-old trees, where learning itself is the
                goal.
              </p>
            </div>
            <div className="flex max-w-xs items-center justify-between gap-3 pt-1">
              <div className="flex gap-3">
                {SOCIALS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition-all hover:scale-110 hover:bg-clay hover:border-clay hover:text-white"
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </a>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollToId(ENQUIRY_ID)}
                className="cursor-pointer rounded-md bg-clay px-6 py-2.5 text-[0.85rem] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-[1px] hover:bg-clay-deep active:translate-y-0"
              >
                Enroll Now!
              </button>
            </div>
          </div>

          <nav aria-label="Academics Menu">
            <h3 className={footerHeadingClass}>Academics</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {ACADEMIC_LINKS.map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => scrollToId("academics")}
                    className={footerLinkClass}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Quick Links Menu">
            <h3 className={footerHeadingClass}>Quick Links</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV_LINKS.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(n.id)}
                    className={footerLinkClass}
                  >
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className={footerHeadingClass}>Visit Us</h3>
            <address className="mt-4 flex flex-col gap-3 text-[13px] not-italic text-ivory/60">
              <span className="leading-relaxed">
                {CONTACT.address[0]}
                <br />
                {CONTACT.address[1]}
              </span>
              <div className="flex flex-col gap-1.5 mt-1 font-mono text-[13px]">
                {CONTACT.phones.map((phone) => (
                  <a
                    key={phone.href}
                    href={phone.href}
                    className="w-fit transition-colors hover:text-clay"
                  >
                    {phone.label}
                  </a>
                ))}
              </div>
              <a
                href={`mailto:${CONTACT.email}`}
                className="w-fit font-mono text-[13px] transition-colors hover:text-clay mt-1"
              >
                {CONTACT.email}
              </a>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-6 font-mono text-xs text-ivory/40 sm:flex-row">
          <p>© {new Date().getFullYear()} SKEI, Bangalore.</p>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
