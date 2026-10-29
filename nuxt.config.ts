// Nuxt toolkit for Astral. The routes, their render modes (route rules), the
// prerender list and the redirects all come from the CMS schema, read once when
// this configuration loads (modules/astral.ts). Every page is server-rendered
// HTML without Nuxt's client scripts (noScripts); the only JavaScript is the
// sub-1 kB live postlist island, inlined on the pages that have one.
export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  modules: ["./modules/astral"],
  devtools: { enabled: false },
  telemetry: false,
  css: ["~/assets/styles/index.css", "~/assets/styles/nuxt.css"],
  // Pages and blocks import their components explicitly (the registry in BlocksRenderer.vue maps CMS apiIds).
  components: { dirs: [] },
  vue: {
    compilerOptions: { isCustomElement: (tag) => tag.startsWith("astral-") },
  },
  features: { inlineStyles: true },
  // prerenderErrorPages: `nuxt generate` writes a real 404.html (the error page rendered), not an empty SPA shell.
  experimental: { payloadExtraction: false, prerenderErrorPages: true },
  nitro: {
    preset: "node-server",
    compressPublicAssets: false,
    prerender: { crawlLinks: false, failOnError: true },
    routeRules: {
      // The site's own on-demand routes: never prerendered.
      "/preview": { prerender: false },
      "/api/**": { prerender: false },
      // Fonts are not hashed: a week, so a swapped file still reaches visitors. Hashed build assets (/_nuxt) get a year from Nitro.
      "/fonts/**": { headers: { "cache-control": "public, max-age=604800" } },
    },
  },
  typescript: { strict: true, typeCheck: false },
});
