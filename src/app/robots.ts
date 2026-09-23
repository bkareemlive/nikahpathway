import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/api/",
        "/auth/",
        "/browse",
        "/dashboard",
        "/forgot-password",
        "/login",
        "/matches",
        "/onboarding",
        "/profile",
        "/register",
        "/requests",
        "/shortlist",
        "/suspended",
        "/viewed",
        "/wali",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
