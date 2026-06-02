import {
  RiInstagramFill,
  RiFacebookFill,
  RiYoutubeFill,
  RiTwitterXFill,
  type RemixiconComponentType,
} from "@remixicon/react";

export const SCROLL_THRESHOLD = 20;

export const ENQUIRY_ID = "enquiry";

export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

export const CONTACT = {
  address: ["Edward Road, Off Queens Road", "Bangalore - 560052, Karnataka"],
  phones: [
    { label: "080 22341011", href: "tel:08022341011" },
    { label: "080 22263022", href: "tel:08022263022" },
    { label: "+91 9980797527", href: "tel:+919980797527" },
  ],
  email: "info@skei.edu.in",
} as const;

export const SOCIALS: { label: string; href: string; icon: RemixiconComponentType }[] = [
  { label: "Instagram", href: "https://www.instagram.com/skei.edu.in/", icon: RiInstagramFill },
  {
    label: "Facebook",
    href: "https://www.facebook.com/smt.kamalabai.educational.institution/",
    icon: RiFacebookFill,
  },
  { label: "X (Twitter)", href: "https://x.com/KamalabaiSchool", icon: RiTwitterXFill },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCh8Qu-jAjlLWzkaqA29I9lQ/videos",
    icon: RiYoutubeFill,
  },
];
