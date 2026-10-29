<script setup lang="ts">
import { hasRichText, type Block, type Media } from "#shared/astral/index";
import type { Link } from "#shared/site/content";
import CmsImage from "../CmsImage.vue";

const props = defineProps<{ block: Block<{ title: string; text: string | null; image: Media | null; imageSide: string | null; link: Link | null }>; locale: string; index: number }>();
const heading = props.index === 0 ? "h1" : "h2";
const start = props.block.imageSide === "start";
</script>

<template>
  <section :class="['block', 'block-mediatext', 'mediatext', { 'mediatext--start': start }]" :data-block="block.key">
    <div class="container">
      <div class="mediatext__grid">
        <div class="mediatext__content">
          <component :is="heading">{{ block.title }}</component>
          <div v-if="hasRichText(block.text)" class="prose" v-html="block.text" />
          <a v-if="block.link?.url" class="arrow-link" :href="block.link.url" :target="block.link.newTab ? '_blank' : undefined" :rel="block.link.newTab ? 'noopener' : undefined">{{ block.link.label }}</a>
        </div>
        <div v-if="block.image" class="mediatext__media">
          <CmsImage :media="block.image" sizes="(min-width: 56em) 36rem, 100vw" />
        </div>
      </div>
    </div>
  </section>
</template>
