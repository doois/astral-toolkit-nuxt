<script setup lang="ts">
// `body` is HTML the CMS sanitized (see shared/astral/richtext.ts): v-html is safe here.
import { hasRichText, type Block } from "#shared/astral/index";

const props = defineProps<{ block: Block<{ body: string | null; width: string | null }>; locale: string; index: number }>();
const wide = props.block.width === "wide";
</script>

<template>
  <section v-if="hasRichText(block.body)" :class="['block', 'block-richtext', 'richtext', { 'richtext--wide': wide }]" :data-block="block.key">
    <div :class="['container', { 'container--narrow': !wide }]">
      <div class="prose" v-html="block.body" />
    </div>
  </section>
</template>
