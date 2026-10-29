// What each generated route needs: the data of the page being rendered (for
// GET /api/astral/page) and the paths to prerender (for the build, called by
// modules/astral.ts). The config is passed in, so the same code runs at config
// time (the module) and at runtime (the server, reading #astral/config).

import { fillPattern, listingUrl, pathOf, type Block, type Entry } from "../../shared/astral/index";
import { PAGE_SIZE, type EntryView, type ListingView, type PageResult, type Post } from "../../shared/site/content";
import { t } from "../../shared/site/i18n";
import { pagedUrl, type AstralConfig, type SiteRoute } from "../../shared/site/routes";
import { getEntry, getSingle, getSite, getTerm, getTerms, listAll, listPosts } from "./cms";

type Params = { slug?: string; page?: string };
type Outcome<T> = { kind: "ok"; page: T; tags: string[] } | { kind: "notFound" } | { kind: "redirect"; to: string };

const typeOf = (config: AstralConfig, apiId: string) => config.types.find((x) => x.apiId === apiId)!;
/** The first taxonomy with an archive URL that classifies a collection. */
const taxonomyOf = (config: AstralConfig, apiId: string) => config.taxonomies.find((x) => x.urlPattern && x.types.includes(apiId))?.apiId ?? "";

/** The page of a route with its params, plus what surrounds it (settings, menus, JSON-LD) and its cache tags. */
export async function resolvePage(config: AstralConfig, route: SiteRoute, params: Params): Promise<PageResult> {
  const outcome = route.kind === "entry" ? await resolveEntry(config, route, params) : route.kind === "listing" ? await resolveListing(config, route, params) : await resolveTerm(config, route, params);
  if (outcome.kind !== "ok") return outcome;
  const site = await getSite(route.locale);
  return { kind: "ok", route, page: outcome.page, site, tags: [...new Set([`type:${route.type}`, ...outcome.tags])] };
}

// ── Entries ─────────────────────────────────────────────────────────────

async function resolveEntry(config: AstralConfig, route: SiteRoute, params: Params): Promise<Outcome<EntryView>> {
  const type = typeOf(config, route.type);
  const ref = params.slug ?? "";
  const entry = type.kind === "SINGLE" ? await getSingle(route.type, route.locale) : ref ? await getEntry(route.type, ref, route.locale) : null;
  if (!entry) return { kind: "notFound" };
  return { kind: "ok", page: await entryView(config, entry, route.locale), tags: [`entry:${entry.id}`] };
}

/** An entry with the posts its `postlist` blocks show, so the templates render without fetching. */
export async function entryView(config: AstralConfig, entry: Entry, locale: string): Promise<EntryView> {
  const fields = config.types.find((x) => x.apiId === entry.type)?.fields.filter((f) => f.type === "blocks") ?? [];
  const blocks = fields.flatMap((f) => (Array.isArray(entry[f.apiId]) ? (entry[f.apiId] as Block[]) : []));
  const lists: Record<string, Post[]> = {};
  await Promise.all(
    blocks
      .filter((block) => block.component === "postlist")
      .map(async (block) => {
        const { limit, category } = postListQuery(block);
        lists[block.key] = (await listPosts(locale, 1, category, limit)).data;
      }),
  );
  return { view: "entry", locale, entry, lists };
}

/** The query of a postlist block, shared by the server render and the live island URL. */
export function postListQuery(block: Block) {
  const limit = Math.min(Math.max(Number(block.limit) || 3, 1), 12);
  const category = typeof block.category === "string" && block.category.trim() ? block.category.trim() : undefined;
  return { limit, category };
}

// ── Listings ────────────────────────────────────────────────────────────

async function resolveListing(config: AstralConfig, route: SiteRoute, params: Params): Promise<Outcome<ListingView>> {
  const type = typeOf(config, route.type);
  const base = listingUrl(type.urlPattern, route.locale, config.format);
  const page = route.paged ? Number(params.page) : 1;
  if (route.paged && (!Number.isInteger(page) || page < 2)) return { kind: "redirect", to: base };
  const [{ data: posts, meta }, terms] = await Promise.all([listPosts(route.locale, page, undefined, PAGE_SIZE), getTerms(taxonomyOf(config, route.type), route.locale)]);
  if (page > Math.max(meta.pageCount, 1)) return { kind: "notFound" };
  const alternates = config.format.locales.map((locale) => ({ locale, url: pagedUrl(listingUrl(type.urlPattern, locale, config.format), page, locale) }));
  return { kind: "ok", page: { view: "listing", locale: route.locale, title: t(route.locale).blog, posts, meta, base, allUrl: base, terms, current: null, alternates }, tags: [] };
}

// ── Term archives ───────────────────────────────────────────────────────

async function resolveTerm(config: AstralConfig, route: SiteRoute, params: Params): Promise<Outcome<ListingView>> {
  const type = typeOf(config, route.type);
  const slug = params.slug ?? "";
  const term = slug ? await getTerm(route.taxonomy!, slug, route.locale) : null;
  if (!term) return { kind: "notFound" };
  const allUrl = listingUrl(type.urlPattern, route.locale, config.format);
  const base = term.url ?? allUrl;
  const page = route.paged ? Number(params.page) : 1;
  if (route.paged && (!Number.isInteger(page) || page < 2)) return { kind: "redirect", to: base };
  // The term's own slug is the canonical one in this locale: a slug of another locale redirects.
  if (term.slug !== slug) return { kind: "redirect", to: pagedUrl(base, page, route.locale) };
  const [{ data: posts, meta }, terms] = await Promise.all([listPosts(route.locale, page, term.id, PAGE_SIZE), getTerms(route.taxonomy!, route.locale)]);
  if (page > Math.max(meta.pageCount, 1)) return { kind: "notFound" };
  const alternates = term.meta.alternates.map((a) => ({ locale: a.locale, url: a.url ? pagedUrl(a.url, page, a.locale) : null }));
  return { kind: "ok", page: { view: "listing", locale: route.locale, title: term.name, description: term.description, posts, meta, base, allUrl, terms, current: term, alternates }, tags: [`taxonomy:${route.taxonomy}`] };
}

// ── Prerender list ──────────────────────────────────────────────────────

const fill = (pattern: string, values: Record<string, string>) => pattern.replace(/\[(\w+)\]/g, (_, key: string) => encodeURIComponent(values[key] ?? ""));

/** Every path of a static route (the build prerenders them). */
export async function routePaths(config: AstralConfig, route: SiteRoute): Promise<string[]> {
  if (route.kind === "entry") {
    const type = typeOf(config, route.type);
    if (type.kind === "SINGLE") return [route.pattern];
    const entries = await listAll(route.type, route.locale);
    return (
      entries
        // The CMS decides the URL (the entry with slug "home" is "/"): only entries whose URL is this pattern's.
        .filter((entry) => pathOf(entry.meta.url) === pathOf(fillPattern(type.urlPattern!, { slug: entry.slug ?? entry.id, id: entry.id, locale: route.locale }, config.format)))
        .map((entry) => fill(route.pattern, { slug: entry.slug ?? entry.id, id: entry.id }))
    );
  }
  if (route.kind === "listing") {
    if (!route.paged) return [route.pattern];
    const { meta } = await listPosts(route.locale, 1);
    return Array.from({ length: Math.max(meta.pageCount - 1, 0) }, (_, i) => fill(route.pattern, { page: String(i + 2) }));
  }
  const terms = await getTerms(route.taxonomy!, route.locale);
  if (!route.paged) return terms.map((term) => fill(route.pattern, { slug: term.slug }));
  const paths: string[] = [];
  for (const term of terms) {
    const { meta } = await listPosts(route.locale, 1, term.id);
    for (let page = 2; page <= meta.pageCount; page++) paths.push(fill(route.pattern, { slug: term.slug, page: String(page) }));
  }
  return paths;
}
