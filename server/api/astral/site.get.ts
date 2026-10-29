import config from "#astral/config";
import { getSite } from "../../lib/cms";

// Settings, menus and the site's JSON-LD of a locale, for the pages outside the
// route table (the 404 and the preview error).
export default defineEventHandler(async (event) => {
  const asked = getQuery(event).locale;
  const locale = typeof asked === "string" && config.format.locales.includes(asked) ? asked : config.format.defaultLocale;
  setResponseHeaders(event, { "cache-control": "no-store", "x-robots-tag": "noindex" });
  return getSite(locale);
});
