import { env } from "../lib/env";

// Prerendered with the static pages (modules/astral.ts adds it to the list).
export default defineEventHandler((event) => {
  setResponseHeader(event, "content-type", "text/plain; charset=utf-8");
  return ["User-agent: *", "Allow: /", "Disallow: /preview", "Disallow: /api/", "", `Sitemap: ${env.siteUrl}/sitemap.xml`, ""].join("\n");
});
