<script setup lang="ts">
// Logos are shown at a fixed height; the alt text (the company name) is the accessible name.
import type { Block, Media } from "#shared/astral/index";
import CmsImage from "../CmsImage.vue";

const props = defineProps<{ block: Block<{ title: string | null; logos: Media[] | null }>; locale: string; index: number }>();
const logos = props.block.logos ?? [];
</script>

<template>
  <section v-if="logos.length > 0" class="block block-logos logos" :data-block="block.key">
    <div class="container">
      <p v-if="block.title" class="logos__title eyebrow">{{ block.title }}</p>
      <ul class="logos__list">
        <li v-for="logo in logos" :key="logo.id">
          <CmsImage :media="logo" sizes="160px" :priority="false" />
        </li>
      </ul>
    </div>
  </section>
</template>
