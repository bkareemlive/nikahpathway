import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { posts } from "@/data/posts";

const publicPaths = [
  "",
  "/approach",
  "/for-guardians",
  "/independent-wali",
  "/journal",
  "/members",
  "/membership",
  "/stories",
  "/widows-and-widowers",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = publicPaths.map((path) => ({
    url: `${site.url}${path}`,
    priority: path === "" ? 1 : 0.7,
  }));
  const articles = posts.map((p) => ({
    url: `${site.url}/journal/${p.slug}`,
    lastModified: new Date(p.date),
    priority: 0.5,
  }));
  return [...pages, ...articles];
}
