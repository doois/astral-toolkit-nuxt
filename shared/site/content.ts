// The shapes the templates read. Field shapes follow astral.model.json; narrow
// them further in your own site if you change the model. The server routes
// (server/api/astral/*) answer with these, the pages render them.

import type { Block, Entry, JsonLd, ListMeta, Media, Menu, Term } from "../astral/index";
import type { SiteRoute } from "./routes";

export type Link = { label: string; url: string; newTab: boolean | null };
export type Settings = Entry<{ siteName: string; logo: Media | null; description: string | null; social: Link[] | null; footerText: string | null; contactEmail: string | null }>;
export type Author = Entry<{ name: string; photo: Media | null; bio: string | null }>;
export type Post = Entry<{ title: string; excerpt: string | null; cover: Media | null; body: string | null; date: string | null; author: Author | null; category: Term[] | null }>;
export type Page = Entry<{ title: string; blocks: Block[] | null }>;
export type Home = Entry<{ blocks: Block[] | null }>;

export const POST_TYPE = "post";
export const CATEGORY = "category";
export const PAGE_SIZE = 9;

/** What every page needs around its content: SITE_URL, settings, the two menus and the site's JSON-LD. */
export type SiteData = { locale: string; siteUrl: string; settings: Settings; header: Menu; footer: Menu; jsonLd: JsonLd | null };

/** An entry, plus the posts of its `postlist` blocks (by block key), fetched on the server. */
export type EntryView = { view: "entry"; locale: string; entry: Entry; lists: Record<string, Post[]> };

export type ListingView = {
  view: "listing";
  locale: string;
  title: string;
  description?: string | null;
  posts: Post[];
  meta: ListMeta;
  /** The listing's page-1 URL (pagination builds on it). */
  base: string;
  /** The listing of every post (the "all" filter). */
  allUrl: string;
  terms: Term[];
  current: Term | null;
  alternates: { locale: string; url: string | null }[];
};

export type PageView = EntryView | ListingView;

/** The answer of GET /api/astral/page: the page, what surrounds it, and the cache tags it carries. */
export type PageResult =
  | { kind: "ok"; route: SiteRoute; page: PageView; site: SiteData; tags: string[] }
  | { kind: "notFound" }
  | { kind: "redirect"; to: string };

/** The answer of GET /api/astral/preview. */
export type PreviewResult = { ok: true; page: EntryView; site: SiteData } | { ok: false; problem: string };
