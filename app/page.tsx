import Academics from "@/components/sections/academics";
import FAQ from "@/components/sections/faq";
import Hero from "@/components/sections/hero";
import CampusVideo from "@/components/sections/campus-video";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import AlumniSpeak from "@/components/sections/alumni-speak";
import TrustStrip from "@/components/sections/trust-strip";
import Gallery from "@/components/sections/gallery";

export default function Home() {
  return (
    <>
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-clay focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-ivory"
      >
        Skip to content
      </a>

      <Navbar />

      <main className="overflow-x-clip">
        <Hero />
        <CampusVideo />
        <TrustStrip />
        <Academics />
        <TrustStrip />
        <Gallery />
        <TrustStrip className="-mb-6 sm:-mb-8" />
        <FAQ />
        <AlumniSpeak />
      </main>

      <Footer />
    </>
  );
}
