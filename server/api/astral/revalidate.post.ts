import config from "#astral/config";
import { pathsOf, tagsOf, typesOf, verifyWebhook } from "../../../shared/astral/index";
import { env } from "../../lib/env";
import { purgeMemos, purgeMemoTags } from "../../lib/memo";

// The CMS calls this on every change (the project's webhook). After checking the
// signature, the site:
// 1. purges from Nitro's cache storage the "revalidate" pages of the event's paths
//    and tags, and every cached CMS response carrying one of the tags;
// 2. when a static type, or something every page uses (menus, settings, schema,
//    taxonomies), changed, asks for a rebuild through ASTRAL_REBUILD_HOOK;
// 3. on "site.rebuild" (the admin's button), asks for the rebuild right away.
//
// On a CDN, the same paths and tags are what to purge (Cache-Tag header): add the
// CDN's purge call where `requestRebuild` is called, with the same `paths` and `tags`.

const GLOBAL_TAGS = ["menus", "settings", "schema"];

export default defineEventHandler(async (event) => {
  const raw = (await readRawBody(event, "utf8")) ?? "";
  const result = await verifyWebhook(raw, getRequestHeaders(event), env.webhookSecret);
  if (!result.ok) {
    setResponseStatus(event, result.reason === "missing_secret" ? 503 : 401);
    return { ok: false, error: result.reason };
  }

  const { payload } = result;
  const paths = pathsOf(payload);
  const tags = tagsOf(payload);
  const types = typesOf(payload);
  const staticTypes = types.filter((apiId) => (config.types.find((t) => t.apiId === apiId)?.render ?? "static") === "static");
  const touchesGlobal = tags.some((tag) => GLOBAL_TAGS.includes(tag) || tag.startsWith("taxonomy:"));
  const needsRebuild = payload.event === "site.rebuild" || staticTypes.length > 0 || touchesGlobal;

  // Anything shared by every page (menus, settings) invalidates every cached page too.
  const everything = payload.event === "site.rebuild" || touchesGlobal;
  const purged = everything ? purgeMemos() + (await purgePages({ all: true })) : purgeMemoTags(tags) + (await purgePages({ paths, tags }));

  const rebuild = needsRebuild ? await requestRebuild(payload.event) : "not_needed";
  setResponseHeader(event, "cache-control", "no-store");
  return { ok: true, event: result.event, purged, paths, tags, rebuild };
});

/** POSTs to the deploy hook (Dokploy, GitHub, any CI). Without one, the answer says so and the admin's build status stays as it was. */
async function requestRebuild(reason: string): Promise<"requested" | "no_hook" | "failed"> {
  if (!env.rebuildHook) return "no_hook";
  try {
    const response = await fetch(env.rebuildHook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event_type: "astral-rebuild", reason, at: new Date().toISOString() }) });
    return response.ok ? "requested" : "failed";
  } catch {
    return "failed";
  }
}
