// Configuration comes from the environment, never from the repository. At build
// time Nuxt loads .env into process.env; in the Node container the values come
// from the process environment at runtime (`npm start` reads .env when present).
// The names follow the toolkit contract (cms/docs/TOOLKITS.md), so they are read
// from process.env directly rather than through NUXT_-prefixed runtimeConfig.

const read = (name: string): string => (process.env[name] ?? "").trim();

export const env = {
  get url() {
    return read("ASTRAL_URL").replace(/\/+$/, "");
  },
  get project() {
    return read("ASTRAL_PROJECT");
  },
  get token() {
    return read("ASTRAL_TOKEN");
  },
  get webhookSecret() {
    return read("ASTRAL_WEBHOOK_SECRET");
  },
  get buildWebhookId() {
    return read("ASTRAL_BUILD_WEBHOOK_ID");
  },
  get siteUrl() {
    return (read("SITE_URL") || "http://localhost:3000").replace(/\/+$/, "");
  },
  get rebuildHook() {
    return read("ASTRAL_REBUILD_HOOK");
  },
  get localeUrls() {
    return read("ASTRAL_LOCALE_URLS");
  },
  get buildLocales() {
    return read("ASTRAL_BUILD_LOCALES");
  },
};

/** Fails early with a clear message when the CMS connection is not configured. */
export function requireEnv() {
  const missing = ["ASTRAL_URL", "ASTRAL_PROJECT"].filter((name) => !read(name));
  if (missing.length) throw new Error(`Astral: defina ${missing.join(", ")} no ambiente (.env). Veja .env.example.`);
}
