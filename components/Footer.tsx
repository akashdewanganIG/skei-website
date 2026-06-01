"use client";

import Image from "next/image";
import { Reveal } from "./Reveal";
import { RiInstagramFill, RiFacebookFill, RiYoutubeFill, RiTwitterXFill } from "@remixicon/react";

import { NAV_LINKS } from "../data/nav";

function Social({ label, href, icon: Icon }: { label: string; href: string; icon: any }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition-all hover:scale-110 hover:bg-clay hover:border-clay hover:text-white"
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink text-ivory rounded-t-[2rem] sm:rounded-t-[3rem] mt-[-3rem] sm:mt-[-4rem] relative z-20 shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)]">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-8">
          
          {/* Column 1: Brand & Socials */}
          <div className="flex flex-col gap-5">
            <button 
              type="button" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
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
                Smt. Kamalabai Educational Institution (SKEI) is a CBSE day school in Bengaluru offering education from Nursery to Grade 10.
              </p>
              <p>
                We nurture tomorrow's leaders through character, curiosity, and community.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <Social label="Instagram" href="https://www.instagram.com/skei.edu.in/" icon={RiInstagramFill} />
              <Social label="Facebook" href="https://www.facebook.com/smt.kamalabai.educational.institution/" icon={RiFacebookFill} />
              <Social label="X (Twitter)" href="https://x.com/KamalabaiSchool" icon={RiTwitterXFill} />
              <Social label="YouTube" href="https://www.youtube.com/channel/UCh8Qu-jAjlLWzkaqA29I9lQ/videos" icon={RiYoutubeFill} />
            </div>
          </div>

          {/* Column 2: Academics */}
          <nav aria-label="Academics Menu">
            <h3 className="font-display text-base font-semibold text-ivory">Academics</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li><button type="button" onClick={() => document.getElementById('academics')?.scrollIntoView({behavior: 'smooth'})} className="w-fit text-left text-[13px] text-ivory/60 transition-colors hover:text-clay">Early Years (Nursery–UKG)</button></li>
              <li><button type="button" onClick={() => document.getElementById('academics')?.scrollIntoView({behavior: 'smooth'})} className="w-fit text-left text-[13px] text-ivory/60 transition-colors hover:text-clay">Primary (Grades 1–5)</button></li>
              <li><button type="button" onClick={() => document.getElementById('academics')?.scrollIntoView({behavior: 'smooth'})} className="w-fit text-left text-[13px] text-ivory/60 transition-colors hover:text-clay">Middle (Grades 6–8)</button></li>
              <li><button type="button" onClick={() => document.getElementById('academics')?.scrollIntoView({behavior: 'smooth'})} className="w-fit text-left text-[13px] text-ivory/60 transition-colors hover:text-clay">Secondary (Grades 9–10)</button></li>
            </ul>
          </nav>

          {/* Column 3: Quick Links */}
          <nav aria-label="Quick Links Menu">
            <h3 className="font-display text-base font-semibold text-ivory">Quick Links</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV_LINKS.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => document.getElementById(n.id)?.scrollIntoView({behavior: 'smooth'})} className="w-fit text-left text-[13px] text-ivory/60 transition-colors hover:text-clay">
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-display text-base font-semibold text-ivory">Visit Us</h3>
            <address className="mt-4 flex flex-col gap-3 text-[13px] not-italic text-ivory/60">
              <span className="leading-relaxed">Edward Road, Off Queens Road<br/>Bengaluru - 560052, Karnataka</span>
              <div className="flex flex-col gap-1.5 mt-1 font-mono text-[13px]">
                <a href="tel:08022341011" className="w-fit transition-colors hover:text-clay">080 22341011</a>
                <a href="tel:08022263022" className="w-fit transition-colors hover:text-clay">080 22263022</a>
                <a href="tel:+919980797527" className="w-fit transition-colors hover:text-clay">+91 9980797527</a>
              </div>
              <a href="mailto:info@skei.edu.in" className="w-fit font-mono text-[13px] transition-colors hover:text-clay mt-1">
                info@skei.edu.in
              </a>
            </address>
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-6 font-mono text-xs text-ivory/40 sm:flex-row">
          <p>© {new Date().getFullYear()} SKEI, Bengaluru.</p>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
