import type { Metadata } from "next";
import { Toaster } from "sonner";
import { inter, lora, jetbrainsMono, caveat } from "./fonts";
import { CONTACT, SOCIALS } from "@/lib/constants";
import "./globals.css";

const schoolJsonLd = {
  "@context": "https://schema.org",
  "@type": "School",
  name: "Smt. Kamalabai Educational Institution (SKEI)",
  alternateName: "SKEI",
  url: "https://skei.edu.in",
  logo: "https://skei.edu.in/logo.png",
  image: "https://skei.edu.in/logo.png",
  description:
    "SKEI is a CBSE day school near Queens Road in Vasanth Nagar, Bangalore, from Nursery to Grade 10. A legacy of excellence since 1931.",
  foundingDate: "1931",
  email: CONTACT.email,
  telephone: CONTACT.phones[0].label,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Edward Road, Off Queens Road, Vasanth Nagar",
    addressLocality: "Bangalore",
    addressRegion: "Karnataka",
    postalCode: "560052",
    addressCountry: "IN",
  },
  areaServed: [
    { "@type": "City", name: "Bangalore" },
    { "@type": "Place", name: "Vasanth Nagar, Bangalore" },
    { "@type": "Place", name: "Queens Road, Bangalore" },
  ],
  sameAs: SOCIALS.map((s) => s.href),
};

export const metadata: Metadata = {
  metadataBase: new URL("https://skei.edu.in"),
  title: "Best CBSE School in Bangalore | Admissions Open 2026–27 | SKEI",
  description:
    "Admissions open for 2026–27 at SKEI, a top CBSE school near Queens Road in Vasanth Nagar, Bangalore. A legacy of excellence since 1931, from Nursery to Grade 10. Book a free school visit today.",
  keywords: [
    "best CBSE school in Bangalore",
    "CBSE school admissions Bangalore",
    "CBSE school admission near me",
    "CBSE admission Bangalore",
    "admissions open schools Bangalore",
    "school admission near me",
    "top schools in Bangalore",
    "CBSE schools near me",
    "schools near Queens Road Bangalore",
    "schools in Vasanth Nagar",
    "nursery admissions Bangalore",
    "best preschool in Bangalore",
    "nursery schools in Bangalore",
    "Montessori school near me",
    "kindergarten near me",
    "play school near me",
    "SKEI",
    "Smt. Kamalabai Educational Institution",
  ],
  authors: [{ name: "SKEI" }],
  creator: "Smt. Kamalabai Educational Institution",
  openGraph: {
    title: "Best CBSE School in Bangalore | Admissions Open 2026–27 | SKEI",
    description:
      "Admissions open for 2026–27 at SKEI, a top CBSE school near Queens Road in Vasanth Nagar, Bangalore. A legacy of excellence since 1931, from Nursery to Grade 10. Book a free school visit today.",
    url: "https://skei.edu.in",
    siteName: "SKEI Bangalore",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Best CBSE School in Bangalore - SKEI",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best CBSE School in Bangalore | Admissions Open 2026–27 | SKEI",
    description:
      "CBSE school admissions open for 2026–27 at SKEI, near Queens Road in Vasanth Nagar, Bangalore. A legacy of excellence since 1931.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is generated from static metadata.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd) }}
        />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Inline theme bootstrap prevents a light/dark flash before React hydrates.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=localStorage.getItem('theme')==='dark';document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="grain antialiased">
        {children}
        <Toaster
          richColors
          position="bottom-center"
          className="skei-toaster"
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  );
}
