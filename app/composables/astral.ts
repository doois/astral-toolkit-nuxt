import config from "#astral/config";
import type { PageResult } from "#shared/site/content";
import { routeById, type SiteRoute } from "#shared/site/routes";

/**
 * The data of the current generated page (app/routes/*.vue), from the server
 * (GET /api/astral/page, an in-process call during server rendering). Throws the
 * 404, follows the redirects, and sets the response headers of the route's mode.
 */
export async function useAstralPage() {
  // Everything that needs the Nuxt instance runs inside it: a composable loses it after its first await.
  const nuxtApp = useNuxtApp();
  const route = useRoute();
  const site = routeById(config, route.name);
  if (!site) throw createError({ statusCode: 404, fatal: true });

  // A static route is files after the build: an address under it that was not prerendered is a 404
  // (like a static host), not a render on demand. Dev renders everything; the prerenderer sends x-nitro-prerender.
  const prerendering = !!useRequestHeader("x-nitro-prerender");
  if (import.meta.server && !import.meta.dev && site.mode === "static" && !prerendering) throw createError({ statusCode: 404, fatal: true });

  const param = (name: string) => (typeof route.params[name] === "string" ? (route.params[name] as string) : undefined);
  const { data, error } = await useFetch<PageResult>("/api/astral/page", {
    key: `astral:${route.path}`,
    query: { route: site.id, slug: param("slug"), page: param("page") },
  });
  if (error.value) throw createError({ statusCode: error.value.statusCode ?? 500, statusMessage: error.value.statusMessage, fatal: true });
  const result = data.value;
  if (!result || result.kind === "notFound") throw createError({ statusCode: 404, fatal: true });
  if (result.kind === "redirect") {
    await nuxtApp.runWithContext(() => navigateTo(result.to, { redirectCode: 301, external: /^https?:\/\//.test(result.to) }));
    return null;
  }
  nuxtApp.runWithContext(() => useModeHeaders(site, result.tags, route.path));
  return result;
}

const DYNAMIC_HEADERS = "public, max-age=0, s-maxage=60, stale-while-revalidate=600";

/**
 * Headers by render mode, set only on a page that rendered (a 404 is never cached):
 * - revalidate: `cache-tag` for a CDN and `x-astral-path`, which the webhook reads back from
 *   Nitro's cache storage to purge by path (server/utils/page-cache.ts). Nitro's swr rule sets
 *   cache-control (s-maxage one year, stale-while-revalidate).
 * - dynamic: a short shared cache.
 */
function useModeHeaders(route: SiteRoute, tags: string[], path: string) {
  if (!import.meta.server) return;
  if (route.mode === "revalidate") {
    useResponseHeader("cache-tag").value = tags.join(",");
    useResponseHeader("x-astral-path").value = path.replace(/\/+$/, "") || "/";
  }
  if (route.mode === "dynamic") useResponseHeader("cache-control").value = DYNAMIC_HEADERS;
}

/**
 * Whether the next image of this response is its first: eager with fetchpriority="high".
 * The count lives on the request, so blocks need no coordination.
 */
export function useImagePriority(priority?: boolean) {
  const context = (useRequestEvent()?.context ?? {}) as { astralImages?: number };
  const first = priority ?? (context.astralImages ?? 0) === 0;
  context.astralImages = (context.astralImages ?? 0) + 1;
  return first;
}
