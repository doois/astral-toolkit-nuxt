<script setup lang="ts">
import type { Block, Media } from "#shared/astral/index";
import CmsImage from "../CmsImage.vue";

const props = defineProps<{ block: Block<{ title: string | null; images: Media[] | null; columns: string | null }>; locale: string; index: number }>();
const columns = props.block.columns === "2" ? "2" : "3";
const heading = props.index === 0 ? "h1" : "h2";
const images = props.block.images ?? [];
</script>

<template>
  <section v-if="images.length > 0" class="block block-gallery gallery" :data-block="block.key">
    <div class="container">
      <div v-if="block.title" class="block__head">
        <component :is="heading">{{ block.title }}</component>
      </div>
      <ul :class="['gallery__grid', `gallery__grid--${columns}`]">
        <li v-for="image in images" :key="image.id">
          <figure class="gallery__item">
            <CmsImage :media="image" :sizes="columns === '2' ? '(min-width: 74rem) 36rem, 50vw' : '(min-width: 74rem) 24rem, (min-width: 48em) 33vw, 50vw'" />
            <figcaption v-if="image.caption">{{ image.caption }}</figcaption>
          </figure>
        </li>
      </ul>
    </div>
  </section>
</template>
