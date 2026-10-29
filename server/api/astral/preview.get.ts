import config from "#astral/config";
import type { PreviewResult } from "../../../shared/site/content";
import { cms, getSite } from "../../lib/cms";
import { entryView } from "../../lib/resolve";

// The draft behind a preview token (the editor's "Preview" button opens
// <site>/preview?token=...). The token is traded for the draft at the CMS, no API
// key involved. Never cached, never indexed.
export default defineEventHandler(async (event): Promise<PreviewResult> => {
  setResponseHeaders(event, { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" });
  const query = getQuery(event);
  const token = String(query.token ?? query.preview ?? "");
  if (!token) return { ok: false, problem: "token_missing" };
  try {
    const entry = await cms().preview(token);
    const [page, site] = await Promise.all([entryView(config, entry, entry.locale), getSite(entry.locale)]);
    return { ok: true, page, site };
  } catch (error) {
    return { ok: false, problem: error instanceof Error && "code" in error ? String((error as { code: string }).code) : "preview_failed" };
  }
});
