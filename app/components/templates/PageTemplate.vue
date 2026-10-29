<script setup lang="ts">
// A page is its blocks. When the first block is not a hero, the title opens the page.
import type { EntryView, Page, SiteData } from "#shared/site/content";
import BlocksRenderer from "../blocks/BlocksRenderer.vue";
import SiteDocument from "../SiteDocument.vue";

const props = withDefaults(defineProps<{ entry: Page; view: EntryView; site: SiteData; preview?: boolean }>(), { preview: false });
const blocks = props.entry.blocks ?? [];
const opensWithHero = blocks[0]?.component === "hero";
</script>

<template>
  <SiteDocument :site="site" :locale="view.locale" :title="entry.seo?.title ?? entry.title" :description="entry.seo?.description" :image="entry.seo?.image" :canonical="entry.seo?.canonical" :alternates="entry.meta.alternates" :noindex="preview || entry.seo?.noindex">
    <template #banner><slot name="banner" /></template>
    <header v-if="!opensWithHero" class="container page-header">
      <h1>{{ entry.title }}</h1>
    </header>
    <BlocksRenderer :blocks="blocks" :locale="view.locale" :lists="view.lists" />
  </SiteDocument>
</template>
