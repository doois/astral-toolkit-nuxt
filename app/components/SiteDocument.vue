<script setup lang="ts">
// The document around every page: head (title, description, canonical, hreflang,
// Open Graph, JSON-LD), header, footer. What it needs from the CMS (settings,
// menus, site JSON-LD) arrives with the page data (`site`).
import config from "#astral/config";
import { fillPattern, type Media } from "#shared/astral/index";
import type { SiteData } from "#shared/site/content";
import { t } from "#shared/site/i18n";
import SiteFooter from "./SiteFooter.vue";
import SiteHeader from "./SiteHeader.vue";

const props = withDefaults(
  defineProps<{
    site: SiteData;
    locale: string;
    title: string;
    description?: string | null;
    /** Share image (og:image). */
    image?: Media | null;
    /** The page's own canonical path or URL; default: the current path. */
    canonical?: string | null;
    /** The same page in other locales (hreflang and the language switcher). */
    alternates?: { locale: string; url: string | null }[];
    noindex?: boolean;
    /** schema.org items added to the site's graph (Organization, WebSite). */
    jsonLd?: Record<string, unknown>[];
    ogType?: "website" | "article";
    /** The header's current item: the path the menu should mark (default: the current path). */
    currentPath?: string;
  }>(),
  { description: null, image: null, canonical: null, alternates: () => [], noindex: false, jsonLd: () => [], ogType: "website", currentPath: undefined },
);

const ui = t(props.locale);
const settings = props.site.settings;
const siteUrl = props.site.siteUrl;
const siteName = settings.siteName;
const fullTitle = props.title && props.title !== siteName ? `${props.title} · ${siteName}` : siteName;
const metaDescription = props.description || settings.description || "";

const absolute = (path: string) => (/^https?:\/\//.test(path) ? path : new URL(path, siteUrl).href);
const path = useRoute().path.replace(/\/+$/, "") || "/";
const canonicalUrl = absolute(props.canonical || path);
const ogImage = props.image?.url ?? settings.logo?.url ?? null;

// hreflang: every locale the page exists in, plus x-default on the default locale.
const languages = props.alternates.filter((a) => a.url).map((a) => ({ locale: a.locale, href: absolute(a.url!) }));
const xDefault = languages.find((a) => a.locale === config.format.defaultLocale) ?? languages[0];

const graph = [
  ...(props.site.jsonLd?.["@graph"] ?? []),
  { "@type": "WebPage", "@id": `${canonicalUrl}#webpage`, url: canonicalUrl, name: fullTitle, ...(metaDescription ? { description: metaDescription } : {}), inLanguage: props.locale, ...(ogImage ? { image: ogImage } : {}) },
  ...props.jsonLd,
];
const structuredData = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");

/** The home of a locale ("/" or "/en"). */
const homeOf = (l: string) => fillPattern("/", { slug: "", locale: l }, config.format);

useHead({
  htmlAttrs: { lang: props.locale },
  title: fullTitle,
  meta: [
    { name: "color-scheme", content: "light dark" },
    { name: "theme-color", content: "#faf8f5", media: "(prefers-color-scheme: light)" },
    { name: "theme-color", content: "#141316", media: "(prefers-color-scheme: dark)" },
  ],
  link: [
    { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    // Only the text face is preloaded: it paints first. The display serif swaps in (metric-matched fallback).
    { rel: "preload", href: "/fonts/inter-variable.woff2", as: "font", type: "font/woff2", crossorigin: "" },
    { rel: "canonical", href: canonicalUrl },
    ...(languages.length > 1 ? languages.map((a) => ({ rel: "alternate" as const, hreflang: a.locale, href: a.href })) : []),
    ...(languages.length > 1 && xDefault ? [{ rel: "alternate" as const, hreflang: "x-default", href: xDefault.href }] : []),
  ],
  script: [{ type: "application/ld+json", innerHTML: structuredData, key: "jsonld" }],
});
useSeoMeta({
  description: metaDescription || undefined,
  robots: props.noindex ? "noindex, nofollow" : undefined,
  ogType: props.ogType,
  ogSiteName: siteName,
  ogTitle: fullTitle,
  ogDescription: metaDescription || undefined,
  ogUrl: canonicalUrl,
  ogLocale: props.locale.replace("-", "_"),
  ogImage: ogImage ?? undefined,
  ogImageWidth: ogImage && props.image?.width && props.image?.height ? props.image.width : undefined,
  ogImageHeight: ogImage && props.image?.width && props.image?.height ? props.image.height : undefined,
  twitterCard: ogImage ? "summary_large_image" : "summary",
});
</script>

<template>
  <a class="skip-link" href="#content">{{ ui.skipToContent }}</a>
  <SiteHeader :locale="locale" :settings="settings" :menu="site.header" :alternates="alternates" :current-path="currentPath ?? path" :home-of="homeOf" />
  <slot name="banner" />
  <main id="content" tabindex="-1">
    <slot />
  </main>
  <SiteFooter :locale="locale" :settings="settings" :menu="site.footer" :home-of="homeOf" />
</template>
