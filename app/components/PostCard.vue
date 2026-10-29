<script setup lang="ts">
import type { Post } from "#shared/site/content";
import { formatDate } from "#shared/site/i18n";
import CmsImage from "./CmsImage.vue";

const props = withDefaults(defineProps<{ post: Post; locale: string; headingLevel?: "h2" | "h3" }>(), { headingLevel: "h3" });
const category = props.post.category?.[0] ?? null;
</script>

<template>
  <article class="post-card">
    <a v-if="post.cover" class="post-card__media" :href="post.meta.url ?? '#'" tabindex="-1" aria-hidden="true">
      <CmsImage :media="post.cover" sizes="(min-width: 64em) 24rem, (min-width: 40em) 50vw, 100vw" alt="" />
    </a>
    <div class="post-card__meta">
      <time v-if="post.date" :datetime="post.date">{{ formatDate(post.date, locale) }}</time>
      <template v-if="category">
        <a v-if="category.url" :href="category.url">{{ category.name }}</a>
        <span v-else>{{ category.name }}</span>
      </template>
    </div>
    <component :is="headingLevel" class="post-card__title">
      <a :href="post.meta.url ?? '#'">{{ post.title }}</a>
    </component>
    <p v-if="post.excerpt" class="post-card__excerpt">{{ post.excerpt }}</p>
  </article>
</template>
