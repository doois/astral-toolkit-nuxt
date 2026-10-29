<script setup lang="ts">
// Picks the template of an entry by its type. Types the toolkit does not know
// get the generic one: title, then every richtext and blocks field in order.
import config from "#astral/config";
import { hasRichText, type Block } from "#shared/astral/index";
import type { EntryView, Home, Page, Post, SiteData } from "#shared/site/content";
import BlocksRenderer from "../blocks/BlocksRenderer.vue";
import SiteDocument from "../SiteDocument.vue";
import HomeTemplate from "./HomeTemplate.vue";
import PageTemplate from "./PageTemplate.vue";
import PostTemplate from "./PostTemplate.vue";

const props = withDefaults(defineProps<{ view: EntryView; site: SiteData; preview?: boolean }>(), { preview: false });
const entry = props.view.entry;
const type = config.types.find((t) => t.apiId === entry.type);
const titleField = type?.fields.find((f) => f.type === "text")?.apiId ?? "title";
const title = String(entry[titleField] ?? type?.name ?? entry.type);
const sections = (type?.fields ?? []).filter((f) => f.type === "richtext" || f.type === "blocks");
</script>

<template>
  <HomeTemplate v-if="entry.type === 'home'" :entry="entry as Home" :view="view" :site="site" :preview="preview"><template #banner><slot name="banner" /></template></HomeTemplate>
  <PageTemplate v-else-if="entry.type === 'page'" :entry="entry as Page" :view="view" :site="site" :preview="preview"><template #banner><slot name="banner" /></template></PageTemplate>
  <PostTemplate v-else-if="entry.type === 'post'" :entry="entry as Post" :site="site" :preview="preview"><template #banner><slot name="banner" /></template></PostTemplate>
  <SiteDocument v-else :site="site" :locale="view.locale" :title="entry.seo?.title ?? title" :description="entry.seo?.description" :image="entry.seo?.image" :alternates="entry.meta.alternates" :noindex="preview || entry.seo?.noindex">
    <template #banner><slot name="banner" /></template>
    <header class="container page-header">
      <h1>{{ title }}</h1>
    </header>
    <template v-for="field in sections" :key="field.apiId">
      <BlocksRenderer v-if="field.type === 'blocks'" :blocks="entry[field.apiId] as Block[] | null" :locale="view.locale" :lists="view.lists" />
      <section v-else-if="hasRichText(entry[field.apiId])" class="block container container--narrow">
        <div class="prose" v-html="entry[field.apiId]" />
      </section>
    </template>
  </SiteDocument>
</template>
