<script setup lang="ts">
import config from "#astral/config";
import { fillPattern } from "#shared/astral/index";
import type { EntryView, Home, SiteData } from "#shared/site/content";
import BlocksRenderer from "../blocks/BlocksRenderer.vue";
import SiteDocument from "../SiteDocument.vue";

const props = withDefaults(defineProps<{ entry: Home; view: EntryView; site: SiteData; preview?: boolean }>(), { preview: false });
const settings = props.site.settings;
const alternates = config.format.locales.map((l) => ({ locale: l, url: fillPattern("/", { slug: "", locale: l }, config.format) }));
</script>

<template>
  <SiteDocument :site="site" :locale="view.locale" :title="entry.seo?.title ?? settings.siteName" :description="entry.seo?.description ?? settings.description" :image="entry.seo?.image" :canonical="entry.seo?.canonical" :alternates="alternates" :noindex="preview || entry.seo?.noindex">
    <template #banner><slot name="banner" /></template>
    <BlocksRenderer :blocks="entry.blocks" :locale="view.locale" :lists="view.lists" />
  </SiteDocument>
</template>
