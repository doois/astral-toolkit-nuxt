// The HTML of "revalidate" pages lives in Nitro's cache storage: their swr route
// rule (modules/astral.ts) makes Nitro keep each response, headers included,
// under `cache:nitro:routes:*`. The page adds two headers while rendering
// (app/composables/astral.ts): `x-astral-path` (the path without query) and
// `cache-tag` (type:post, entry:<id>...). Purging reads those back from the
// stored entries, so it never depends on how Nitro hashes its keys.
//
// The default storage is the process memory; mount `cache` on Redis (nitro.storage)
// and every container shares the same pages and the same purge.

type Stored = { value?: { headers?: Record<string, string | string[] | undefined> } };

const BASE = "cache:nitro:routes";

const header = (entry: Stored | null, name: string) => {
  const value = entry?.value?.headers?.[name];
  return Array.isArray(value) ? value.join(",") : (value ?? "");
};

/** Removes the cached pages whose path is one of `paths` or whose tags meet `tags`; `all` removes every one. Returns how many went. */
export async function purgePages({ paths = [], tags = [], all = false }: { paths?: string[]; tags?: string[]; all?: boolean }) {
  const storage = useStorage();
  const wantedPaths = new Set(paths.map((p) => p.replace(/^https?:\/\/[^/]+/, "").replace(/\/+$/, "") || "/"));
  const wantedTags = new Set(tags);
  let n = 0;
  for (const key of await storage.getKeys(BASE)) {
    let hit = all;
    if (!hit) {
      const entry = await storage.getItem<Stored>(key);
      hit = wantedPaths.has(header(entry, "x-astral-path")) || header(entry, "cache-tag").split(",").some((tag) => wantedTags.has(tag.trim()));
    }
    if (hit) {
      await storage.removeItem(key);
      n++;
    }
  }
  return n;
}
