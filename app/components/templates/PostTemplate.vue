<script setup lang="ts">
// A post: header, cover (the page's first image, so eager and high priority),
// body, author. JSON-LD comes from the CMS when the type has structured data
// mapped (meta.jsonLd); otherwise the toolkit builds the BlogPosting itself.
import { hasRichText, type Media } from "#shared/astral/index";
import type { Post, SiteData } from "#shared/site/content";
import { formatDate, t } from "#shared/site/i18n";
import CmsImage from "../CmsImage.vue";
import SiteDocument from "../SiteDocument.vue";

const props = withDefaults(defineProps<{ entry: Post; site: SiteData; preview?: boolean }>(), { preview: false });
const entry = props.entry;
const locale = entry.locale;
const ui = t(locale);
const category = entry.category?.[0] ?? null;
const author = entry.author;
const absolute = (path: string | null | undefined) => (path ? new URL(path, props.site.siteUrl).href : undefined);
const cover: Media | null = entry.cover ?? entry.seo?.image ?? null;

const jsonLd = entry.meta.jsonLd ?? {
  "@type": "BlogPosting",
  "@id": `${absolute(entry.meta.url)}#article`,
  headline: entry.title,
  ...(entry.excerpt ? { description: entry.excerpt } : {}),
  ...(cover ? { image: cover.url } : {}),
  ...(entry.date ? { datePublished: entry.date } : {}),
  dateModified: entry.meta.updatedAt,
  ...(author ? { author: { "@type": "Person", name: author.name } } : {}),
  inLanguage: locale,
  mainEntityOfPage: absolute(entry.meta.url),
};
</script>

<template>
  <SiteDocument :site="site" :locale="locale" :title="entry.seo?.title ?? entry.title" :description="entry.seo?.description ?? entry.excerpt" :image="cover" :canonical="entry.seo?.canonical" :alternates="entry.meta.alternates" :noindex="preview || entry.seo?.noindex" :json-ld="[jsonLd]" og-type="article">
    <template #banner><slot name="banner" /></template>
    <article class="post">
      <header class="container post__header">
        <p v-if="category" class="eyebrow">
          <a v-if="category.url" :href="category.url">{{ category.name }}</a>
          <template v-else>{{ category.name }}</template>
        </p>
        <h1>{{ entry.title }}</h1>
        <p v-if="entry.excerpt" class="lede post__lede">{{ entry.excerpt }}</p>
        <div class="post__byline">
          <CmsImage v-if="author?.photo" :media="author.photo" sizes="36px" alt="" :priority="false" />
          <span v-if="author">{{ ui.by }} <strong>{{ author.name }}</strong></span>
          <time v-if="entry.date" :datetime="entry.date">{{ formatDate(entry.date, locale) }}</time>
        </div>
      </header>
      <div v-if="entry.cover" class="container post__cover">
        <CmsImage :media="entry.cover" sizes="(min-width: 74rem) 74rem, 100vw" :priority="true" />
      </div>
      <div class="container post__body">
        <div v-if="hasRichText(entry.body)" class="prose" v-html="entry.body" />
      </div>
      <footer v-if="author" class="container post__footer">
        <div class="author-card">
          <CmsImage v-if="author.photo" :media="author.photo" sizes="64px" alt="" :priority="false" />
          <div>
            <h3>{{ author.name }}</h3>
            <p v-if="author.bio">{{ author.bio }}</p>
          </div>
        </div>
      </footer>
    </article>
  </SiteDocument>
</template>
