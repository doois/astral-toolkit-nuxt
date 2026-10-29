<script setup lang="ts">
// Renders a `blocks` field: one component per CMS component apiId. A block of
// a component this site does not know is skipped (and noted in dev), so adding
// a component in the CMS never breaks the build. To add a block: create
// app/components/blocks/<Name>Block.vue and register it here (README, "Como adicionar um bloco").
import type { Component } from "vue";
import type { Block } from "#shared/astral/index";
import type { Post } from "#shared/site/content";
import CtaBlock from "./CtaBlock.vue";
import FaqBlock from "./FaqBlock.vue";
import FeaturesBlock from "./FeaturesBlock.vue";
import GalleryBlock from "./GalleryBlock.vue";
import HeroBlock from "./HeroBlock.vue";
import LogosBlock from "./LogosBlock.vue";
import MediaTextBlock from "./MediaTextBlock.vue";
import PostListBlock from "./PostListBlock.vue";
import RichTextBlock from "./RichTextBlock.vue";
import StatsBlock from "./StatsBlock.vue";
import TestimonialsBlock from "./TestimonialsBlock.vue";

const props = defineProps<{ blocks: Block[] | null | undefined; locale: string; lists?: Record<string, Post[]> }>();

const REGISTRY: Record<string, Component> = {
  hero: HeroBlock,
  richtext: RichTextBlock,
  features: FeaturesBlock,
  mediatext: MediaTextBlock,
  gallery: GalleryBlock,
  testimonials: TestimonialsBlock,
  faq: FaqBlock,
  logos: LogosBlock,
  stats: StatsBlock,
  cta: CtaBlock,
  postlist: PostListBlock,
};

const list = (props.blocks ?? []).filter((block) => {
  const known = block.component in REGISTRY;
  if (!known && import.meta.dev) console.warn(`[astral] bloco "${block.component}" sem componente em app/components/blocks`);
  return known;
});
</script>

<template>
  <template v-for="(block, index) in list" :key="block.key">
    <component :is="REGISTRY[block.component]" :block="block" :locale="locale" :index="index" v-bind="block.component === 'postlist' ? { posts: lists?.[block.key] ?? [] } : {}" />
  </template>
</template>
