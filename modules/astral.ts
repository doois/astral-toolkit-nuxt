import { join, relative } from "node:path";
import { addTemplate, createResolver, defineNuxtModule, extendPages, useLogger } from "nuxt/kit";
import type { NitroRouteConfig } from "nitropack";
import { localeFormat, type Redirect, type Schema } from "../shared/astral/index";
import { buildRoutes, type AstralConfig, type SiteRoute } from "../shared/site/routes";
import { cms } from "../server/lib/cms";
import { env, requireEnv } from "../server/lib/env";
import { routePaths } from "../server/lib/resolve";

// Reads the CMS schema once, when Nuxt loads its configuration, and turns it
// into the site: one page route per type, locale and kind (entry, listing, term
// archive), and one route rule per route, from the type's `render`:
//
// - static:     prerendered at build time (the list comes from the CMS); a change asks for a rebuild.
// - revalidate: rendered on the first visit and kept in Nitro's cache storage (swr route rule)
//               until the webhook purges its path or tags.
// - dynamic:    server-rendered on every request, short shared-cache headers.
//
// The route table goes to the app and the server as the generated module
// `#astral/config`. Redirects set in the CMS become redirect route rules.

const YEAR = 31_536_000;
const DAY = 86_400;

/** The route rule of each render mode. Every page ships without Nuxt's client scripts (noScripts). */
export function ruleOf(route: Pick<SiteRoute, "mode">): NitroRouteConfig {
  if (route.mode === "revalidate") return { cache: { swr: true, maxAge: YEAR, staleMaxAge: DAY }, prerender: false };
  if (route.mode === "dynamic") return { cache: false, prerender: false };
  return { prerender: true };
}

const statusOf = (status: number) => ([301, 302, 303, 307, 308] as const).find((s) => s === status) ?? 301;

export default defineNuxtModule({
  meta: { name: "astral" },
  async setup(_options, nuxt) {
    const logger = useLogger("astral");
    const { resolve } = createResolver(import.meta.url);
    requireEnv();

    const client = cms();
    let schema: Schema;
    let redirects: Redirect[] = [];
    try {
      [schema, redirects] = await Promise.all([client.schema(), client.redirects().catch(() => [] as Redirect[])]);
    } catch (error) {
      throw new Error(`Astral: não foi possível ler ${client.apiUrl}/schema (${error instanceof Error ? error.message : String(error)}). Confira ASTRAL_URL, ASTRAL_PROJECT e ASTRAL_TOKEN.`);
    }

    // The URL format the CMS delivers in /schema (localeUrls, localeDomains); ASTRAL_LOCALE_URLS only while it does not.
    const format = localeFormat(schema, schema.localeUrls ? undefined : { mode: env.localeUrls || undefined });
    const only = env.buildLocales.split(",").map((l) => l.trim()).filter((l) => format.locales.includes(l));
    const { routes, dropped } = buildRoutes(schema, format, only.length ? only : format.locales);
    for (const route of dropped) logger.warn(`rota ${route.pattern} (${route.locale}) ignorada: o mesmo caminho já serve outro idioma. No formato "${format.mode}" cada idioma é um build (ASTRAL_BUILD_LOCALES).`);
    const config: AstralConfig = { format, routes, types: schema.types, taxonomies: schema.taxonomies, builtAt: new Date().toISOString() };

    // `#astral/config`: the route table, frozen at build time, for the app and the server alike.
    // A plain module plus its declaration; the alias has no extension, so bundlers load the .js and
    // TypeScript reads the .d.ts next to it.
    const generated = addTemplate({ filename: "astral/config.js", write: true, getContents: () => `export default ${JSON.stringify(config)};\n` });
    addTemplate({
      filename: "astral/config.d.ts",
      write: true,
      getContents: ({ nuxt: n }) => {
        const types = relative(join(n.options.buildDir, "astral"), resolve("../shared/site/routes")).replace(/\\/g, "/");
        return `declare const config: import("${types}").AstralConfig;\nexport default config;\n`;
      },
    });
    const configModule = generated.dst.replace(/\.js$/, "");
    nuxt.options.alias["#astral/config"] = configModule;
    // The server (Nitro) resolves and types it too.
    nuxt.hook("nitro:config", (nitro) => {
      nitro.alias = { ...nitro.alias, "#astral/config": configModule };
    });

    // Pages: one route component, once per route of the table (the route name is its id).
    extendPages((pages) => {
      for (const route of routes) pages.push({ name: route.id, path: route.path, file: resolve("../app/routes/AstralRoute.vue") });
    });

    // Route rules: no client scripts anywhere, then the mode of each route, then the CMS redirects.
    const rules: Record<string, NitroRouteConfig> = { "/**": { noScripts: true } as NitroRouteConfig };
    for (const route of routes) rules[route.rule] = { ...rules[route.rule], ...ruleOf(route) };
    for (const r of redirects) if (r.from.startsWith("/") && r.from !== r.to) rules[r.from] = { redirect: { to: r.to, statusCode: statusOf(r.status) } };
    nuxt.options.routeRules = { ...rules, ...nuxt.options.routeRules };

    // The prerender list: every path of every static route, read from the CMS when the build starts.
    if (!nuxt.options.dev) {
      nuxt.hook("nitro:config", async (nitro) => {
        const lists = await Promise.all(routes.filter((r) => r.mode === "static").map((r) => routePaths(config, r)));
        nitro.prerender ??= {};
        nitro.prerender.routes = [...new Set([...(nitro.prerender.routes ?? []), ...lists.flat(), "/sitemap.xml", "/robots.txt"])];
        logger.info(`${nitro.prerender.routes.length} caminhos para pré-renderizar`);
      });
    }

    const summary = schema.types.filter((t) => t.urlPattern).map((t) => `${t.apiId}: ${t.render ?? "static"}`).join(", ");
    logger.info(`${routes.length} rotas de ${format.locales.join(", ")} (${format.mode}); ${summary}; ${redirects.length} redirecionamentos`);
  },
});
