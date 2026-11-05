// The site's Content-Security-Policy. Same policy as the other toolkits
// (cms/docs/TOOLKITS.md). modules/astral.ts turns it into a route rule, so it is
// frozen at build time, and writes it to `_headers` for static hosts.
//
// Pages ship without Nuxt's scripts and payload (noScripts), so nothing inline
// needs running, with one exception: the <script type="speculationrules"> Nuxt
// adds is JSON, but browsers check it against script-src. 'inline-speculation-rules'
// allows that and only that; it does not allow inline JavaScript.
//
// Images come from the CMS, on ASTRAL_URL or on its media host. ASTRAL_MEDIA_URL
// names that host; without it the site cannot know it (nothing in the API says),
// so img-src takes any https: origin instead of breaking images. JSON-LD is a data
// block, which script-src does not block; style-src keeps 'unsafe-inline' for the
// inlined stylesheet and the images' dominant-color style attribute.

import { env } from "./env";

const originOf = (url: string) => {
  try {
    const { origin, protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? origin : "";
  } catch {
    return "";
  }
};

const directive = (name: string, sources: string[]) => [name, ...new Set(sources.filter(Boolean))].join(" ");

export function contentSecurityPolicy() {
  const cms = originOf(env.url);
  const media = originOf(env.mediaUrl);
  return [
    "default-src 'self'",
    "script-src 'self' 'inline-speculation-rules'",
    "style-src 'self' 'unsafe-inline'",
    directive("img-src", ["'self'", "data:", cms, media || "https:"]),
    "font-src 'self'",
    directive("connect-src", ["'self'", cms]),
    "form-action 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}
