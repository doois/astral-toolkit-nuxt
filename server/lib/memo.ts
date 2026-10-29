// CMS responses (settings, menus, lists) kept in the process, keyed by name and
// tagged with the CMS's cache tags ("type:post", "menus", "settings"...). At
// build time it simply avoids repeated requests while prerendering; at runtime
// a short TTL covers a missed webhook. The revalidation webhook purges it by tag
// (server/api/astral/revalidate.post.ts). The rendered HTML of "revalidate"
// pages lives in Nitro's cache storage instead (server/utils/page-cache.ts).
//
// Stale on error: the last good answer of every key is kept apart (purges do not
// touch it). When a load fails (the CMS down, a network error, a 5xx after the
// client's retries), that answer is served for STALE_RETRY and the CMS is tried
// again after it. Only a key that never loaded fails the request.

type Memo = { value: Promise<unknown>; tags: Set<string>; expires: number };

const memos = new Map<string, Memo>();
const lastGood = new Map<string, unknown>();

/** 5 minutes at runtime; at build time the process ends long before. */
export const DEFAULT_TTL = 5 * 60_000;
/** How long a stale answer is served before the CMS is asked again. */
export const STALE_RETRY = 30_000;

export function memo<T>(key: string, tags: string[], loader: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
  const hit = memos.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const entry: Memo = { value: Promise.resolve(), tags: new Set(tags), expires: Date.now() + ttl };
  const value = loader().then(
    (fresh) => {
      lastGood.set(key, fresh);
      return fresh;
    },
    (error: unknown) => {
      if (!lastGood.has(key)) throw error;
      entry.expires = Date.now() + STALE_RETRY;
      console.warn(`[astral] CMS indisponível para "${key}", servindo a última resposta boa (${error instanceof Error ? error.message : String(error)})`);
      return lastGood.get(key) as T;
    },
  );
  entry.value = value;
  memos.set(key, entry);
  // A failed load with nothing to fall back on is not kept: the next call tries again.
  value.catch(() => memos.delete(key));
  return value;
}

/** Drops every memo that carries one of the tags; returns how many went. */
export function purgeMemoTags(tags: string[]) {
  const wanted = new Set(tags);
  let n = 0;
  for (const [key, entry] of memos) if ([...entry.tags].some((t) => wanted.has(t))) (memos.delete(key), n++);
  return n;
}

export function purgeMemos() {
  const n = memos.size;
  memos.clear();
  return n;
}
