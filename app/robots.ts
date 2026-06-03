import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/skei-admin", "/api"],
    },
    host: "https://skei.edu.in",
  };
}
