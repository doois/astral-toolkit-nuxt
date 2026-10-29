<script setup lang="ts">
import type { Block } from "#shared/astral/index";
import type { Link } from "#shared/site/content";

const props = defineProps<{ block: Block<{ title: string; text: string | null; button: Link | null; tone: string | null }>; locale: string; index: number }>();
const accent = props.block.tone !== "neutral";
const heading = props.index === 0 ? "h1" : "h2";
const button = props.block.button?.url ? props.block.button : null;
</script>

<template>
  <section :class="['block', 'block-cta', 'cta', { 'cta--accent': accent }]" :data-block="block.key">
    <div class="container">
      <div class="cta__box">
        <div>
          <component :is="heading">{{ block.title }}</component>
          <p v-if="block.text">{{ block.text }}</p>
        </div>
        <a v-if="button" :class="['button', accent ? 'button--accent' : '']" :href="button.url" :target="button.newTab ? '_blank' : undefined" :rel="button.newTab ? 'noopener' : undefined">{{ button.label }}</a>
      </div>
    </div>
  </section>
</template>
