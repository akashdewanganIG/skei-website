import type { Metadata } from "next";
import { Toaster } from "sonner";
import { inter, lora, jetbrainsMono, caveat } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://skei.edu.in"),
  title: "Best CBSE School in Bangalore | Admissions Open 2026–27 | SKEI",
  description:
    "Enrol your child at SKEI, a top-ranked CBSE school near Queens Road, Vasanth Nagar. 95 years of excellence. Nursery to Grade 10. Book a free school visit today.",
  keywords: [
    "best cbse school bangalore",
    "cbse school admissions bangalore",
    "best cbse school near Queens Road",
    "cbse school Vasanth Nagar",
    "SKEI",
    "Smt. Kamalabai Educational Institution",
  ],
  authors: [{ name: "SKEI" }],
  creator: "Smt. Kamalabai Educational Institution",
  openGraph: {
    title: "Best CBSE School in Bangalore | Admissions Open 2026–27 | SKEI",
    description:
      "Enrol your child at SKEI, a top-ranked CBSE school near Queens Road, Vasanth Nagar. 95 years of excellence. Nursery to Grade 10. Book a free school visit today.",
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
      "Enrol your child at SKEI, a top-ranked CBSE school near Queens Road, Vasanth Nagar. 95 years of excellence.",
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
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="grain antialiased">
        {children}
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
