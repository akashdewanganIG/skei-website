import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CONTACT, SOCIALS } from "@/lib/constants";
import { caveat, inter, jetbrainsMono, lora } from "./fonts";
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
        {/* Meta Pixel Code */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Meta Pixel tracking script.
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1771813017388587');
fbq('track', 'PageView');`,
          }}
        />
      </head>
      <GoogleTagManager gtmId="GTM-WMDWTDSF" />
      <body className="grain antialiased">
        {/* Google Tag Manager noscript fallback because the component above does not render one. */}
        <noscript>
          <iframe
            title="Google Tag Manager"
            src="https://www.googletagmanager.com/ns.html?id=GTM-WMDWTDSF"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* Meta Pixel Code (noscript) */}
        <noscript>
          {/* biome-ignore lint/performance/noImgElement: Meta Pixel tracking image fallback does not need optimization */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1771813017388587&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code (noscript) */}
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
