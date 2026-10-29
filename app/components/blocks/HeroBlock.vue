<script setup lang="ts">
import type { Block, Media } from "#shared/astral/index";
import type { Link } from "#shared/site/content";
import CmsImage from "../CmsImage.vue";

const props = defineProps<{ block: Block<{ eyebrow: string | null; title: string; text: string | null; image: Media | null; primary: Link | null; secondary: Link | null; align: string | null }>; locale: string; index: number }>();
const center = props.block.align === "center";
const heading = props.index === 0 ? "h1" : "h2";
const primary = props.block.primary?.url ? props.block.primary : null;
const secondary = props.block.secondary?.url ? props.block.secondary : null;
</script>

<template>
  <section :class="['block', 'block-hero', 'hero', { 'hero--center': center }]" :data-block="block.key">
    <div class="container">
      <div :class="['hero__grid', { 'hero__grid--image': !!block.image && !center }]">
        <div class="hero__content">
          <p v-if="block.eyebrow" class="eyebrow">{{ block.eyebrow }}</p>
          <component :is="heading" class="display">{{ block.title }}</component>
          <p v-if="block.text" class="hero__text">{{ block.text }}</p>
          <div v-if="primary || secondary" class="hero__actions">
            <a v-if="primary" class="button" :href="primary.url" :target="primary.newTab ? '_blank' : undefined" :rel="primary.newTab ? 'noopener' : undefined">{{ primary.label }}</a>
            <a v-if="secondary" class="button button--secondary" :href="secondary.url" :target="secondary.newTab ? '_blank' : undefined" :rel="secondary.newTab ? 'noopener' : undefined">{{ secondary.label }}</a>
          </div>
        </div>
        <div v-if="block.image" class="hero__media">
          <CmsImage :media="block.image" :sizes="center ? '(min-width: 74rem) 74rem, 100vw' : '(min-width: 56em) 40vw, 100vw'" />
        </div>
      </div>
    </div>
  </section>
</template>
