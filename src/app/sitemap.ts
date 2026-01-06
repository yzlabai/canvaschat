import type { MetadataRoute } from "next";

import { getSitemapEntries } from "@/lib/seo";

const baseUrl = (process.env.NEXT_PUBLIC_WEB_URL ?? "https://canvas.chat").replace(/\/$/, "");

const timestamp = new Date();

const toAbsoluteUrl = (path: string) => {
  if (path === "/") {
    return `${baseUrl}/`;
  }

  return `${baseUrl}${path}`;
};

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries().map((config) => ({
    url: toAbsoluteUrl(config.path),
    lastModified: timestamp,
    changeFrequency: config.changeFrequency,
    priority: config.priority,
  }));
}
