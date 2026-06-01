"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

export default function CampusVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(videoRef, { margin: "0px" });

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isInView) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isInView]);

  return (
    <section id="campus-video" className="relative z-10 mb-16 mt-8 px-4 sm:mb-24 sm:mt-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
        className="mx-auto w-full max-w-[96%] overflow-hidden rounded-[2rem] shadow-[0_8px_40px_rgba(30,27,23,0.12)] sm:max-w-[98%] lg:max-w-[95%]"
      >
        <div className="relative aspect-video w-full bg-ink/95">
          <video
            ref={videoRef}
            controls
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          >
            <source src="/promo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Bottom gradient for depth */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-ink/20 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
