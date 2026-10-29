// CMS responses (settings, menus, lists) kept in the process, keyed by name and
// tagged with the CMS's cache tags ("type:post", "menus", "settings"...). At
// build time it simply avoids repeated requests while prerendering; at runtime
// a short TTL covers a missed webhook. The revalidation webhook purges it by tag
// (server/api/astral/revalidate.post.ts). The rendered HTML of "revalidate"
// pages lives in Nitro's cache storage instead (server/utils/page-cache.ts).

type Memo = { value: Promise<unknown>; tags: Set<string>; expires: number };

const memos = new Map<string, Memo>();

/** 5 minutes at runtime; at build time the process ends long before. */
export const DEFAULT_TTL = 5 * 60_000;

export function memo<T>(key: string, tags: string[], loader: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
  const hit = memos.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = loader();
  memos.set(key, { value, tags: new Set(tags), expires: Date.now() + ttl });
  // A failed load is not kept: the next call tries again.
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
