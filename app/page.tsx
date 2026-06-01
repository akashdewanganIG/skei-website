import Academics from "@/components/Academics";
import FAQ from "@/components/FAQ";
import Hero from "@/components/Hero";
import CampusVideo from "@/components/CampusVideo";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import TrustStrip from "@/components/TrustStrip";
import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <>
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-clay focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-ivory"
      >
        Skip to content
      </a>


      <Nav />

      <main>
        <Hero />
        <CampusVideo />
        <TrustStrip />
        <Academics />
        <Gallery />
        <FAQ />
        <Testimonials />
      </main>

      <Footer />
    </>
  );
}
