import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/recruiter/", "/profile/"],
    },
    sitemap: "https://jobnova.vercel.app/sitemap.xml",
  };
}
