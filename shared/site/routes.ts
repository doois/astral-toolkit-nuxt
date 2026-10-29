// The site's route table, built from the CMS schema at config time
// (modules/astral.ts) and read by the app and the server through the
// generated module `#astral/config`. One route per type, locale and kind.

import { listingPath, listingUrl, renderMode, routePattern, type LocaleFormat, type RenderMode, type Schema, type SchemaTaxonomy, type SchemaType } from "../astral/index";
import { t } from "./i18n";

export type RouteKind = "entry" | "listing" | "term";

export type SiteRoute = {
  /** Stable id, also the Vue Router route name ("entry:en:/en/blog/[slug]"). */
  id: string;
  /** The pattern in `[param]` notation ("/en/blog/[slug]"). */
  pattern: string;
  /** The same in Vue Router notation ("/en/blog/:slug"). */
  path: string;
  /** The same as a route rule key ("/en/blog/*"). */
  rule: string;
  kind: RouteKind;
  /** The content type (for "term" routes: the collection the taxonomy lists). */
  type: string;
  locale: string;
  mode: RenderMode;
  /** "term" routes: the taxonomy apiId. */
  taxonomy?: string;
  /** Listing and term routes with a [page] parameter. */
  paged?: boolean;
};

export type AstralConfig = {
  format: LocaleFormat;
  routes: SiteRoute[];
  types: SchemaType[];
  taxonomies: SchemaTaxonomy[];
  builtAt: string;
};

const RANK: Record<RenderMode, number> = { static: 0, revalidate: 1, dynamic: 2 };
/** The most demanding of several modes (a listing of static and dynamic types is dynamic). */
export const mostDynamic = (modes: RenderMode[]): RenderMode => modes.reduce((top, m) => (RANK[m] > RANK[top] ? m : top), "static");

const join = (base: string, segment: string) => (base === "/" ? `/${segment}` : `${base}/${segment}`);

type Draft = Omit<SiteRoute, "id" | "path" | "rule">;
const complete = (route: Draft): SiteRoute => ({
  ...route,
  id: `${route.kind}:${route.locale}:${route.pattern}`,
  path: route.pattern.replace(/\[(\w+)\]/g, ":$1"),
  rule: route.pattern.replace(/\[\w+\]/g, "*"),
});

/**
 * Every route the site serves for a schema and locale format. Patterns that
 * repeat (the "domain" and "none" formats give every locale the same paths)
 * keep the first locale only: those formats need one build per locale
 * (ASTRAL_BUILD_LOCALES), see the README.
 */
export function buildRoutes(schema: Schema, format: LocaleFormat, locales = format.locales): { routes: SiteRoute[]; dropped: SiteRoute[] } {
  const routes: SiteRoute[] = [];
  const dropped: SiteRoute[] = [];
  const seen = new Set<string>();
  const add = (draft: Draft) => {
    const route = complete(draft);
    if (seen.has(route.pattern)) dropped.push(route);
    else {
      seen.add(route.pattern);
      routes.push(route);
    }
  };
  const routed = schema.types.filter((type) => type.urlPattern);
  for (const locale of locales) {
    const segment = t(locale).pageSegment;
    for (const type of routed) {
      const mode = renderMode(schema, type);
      add({ pattern: routePattern(type.urlPattern!, locale, format), kind: "entry", type: type.apiId, locale, mode });
      if (type.kind === "COLLECTION" && listingPath(type.urlPattern) !== "/") {
        const base = listingUrl(type.urlPattern, locale, format).replace(/^https?:\/\/[^/]+/, "") || "/";
        add({ pattern: base, kind: "listing", type: type.apiId, locale, mode });
        add({ pattern: join(base, `${segment}/[page]`), kind: "listing", type: type.apiId, locale, mode, paged: true });
      }
    }
    for (const taxonomy of schema.taxonomies.filter((x) => x.urlPattern)) {
      const types = routed.filter((type) => taxonomy.types.includes(type.apiId) && type.kind === "COLLECTION");
      const type = types[0];
      if (!type) continue;
      const mode = mostDynamic(types.map((x) => renderMode(schema, x)));
      const pattern = routePattern(taxonomy.urlPattern!, locale, format);
      add({ pattern, kind: "term", type: type.apiId, locale, mode, taxonomy: taxonomy.apiId });
      add({ pattern: join(pattern, `${segment}/[page]`), kind: "term", type: type.apiId, locale, mode, taxonomy: taxonomy.apiId, paged: true });
    }
  }
  return { routes, dropped };
}

/** A route by id (the Vue Router route name), or undefined for the site's own pages (404, preview). */
export const routeById = (config: Pick<AstralConfig, "routes">, id: unknown) => config.routes.find((r) => r.id === id);

/** The URL of page N of a listing or term route ("/blog" for page 1, "/blog/pagina/2" after). */
export function pagedUrl(base: string, page: number, locale: string) {
  return page <= 1 ? base : join(base, `${t(locale).pageSegment}/${page}`);
}
