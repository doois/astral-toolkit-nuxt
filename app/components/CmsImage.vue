<script setup lang="ts">
// A CMS image: WebP srcset at the project's widths, intrinsic width and height
// (no layout shift), lazy by default. The first image of a page is eager with
// fetchpriority="high" (the count lives on the request, see useImagePriority).
// Pass `priority` to decide by hand.
import { imageAttrs, type Media } from "#shared/astral/index";

// `priority: undefined` keeps "not given" apart from false (Vue casts a missing boolean prop to false).
const props = withDefaults(defineProps<{ media: Media | null | undefined; sizes?: string; priority?: boolean; alt?: string }>(), { priority: undefined, sizes: undefined, alt: undefined });

const attrs = props.media ? imageAttrs(props.media, { sizes: props.sizes, priority: useImagePriority(props.priority), ...(props.alt !== undefined ? { alt: props.alt } : {}) }) : null;
</script>

<template>
  <img v-if="attrs" v-bind="attrs" />
</template>
