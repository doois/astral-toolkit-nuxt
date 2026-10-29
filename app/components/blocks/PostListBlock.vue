<script setup lang="ts">
// The latest posts (fetched on the server with the page, see server/lib/resolve.ts).
// With `live`, the server-rendered list is also an island: a tiny custom element
// fetches /api/astral/posts in the browser and replaces the cards, so a static
// page shows new posts before the next build. It is the only JavaScript the
// toolkit ships, inlined only on pages with a live list.
import type { Block } from "#shared/astral/index";
import type { Link, Post } from "#shared/site/content";
import { t } from "#shared/site/i18n";
import PostCard from "../PostCard.vue";
import liveList from "../../assets/live-list.js?raw";

const props = defineProps<{ block: Block<{ title: string | null; text: string | null; limit: number | null; category: string | null; live: boolean | null; link: Link | null }>; locale: string; index: number; posts: Post[] }>();
const ui = t(props.locale);
const limit = Math.min(Math.max(Number(props.block.limit) || 3, 1), 12);
const category = props.block.category?.trim() || undefined;
const heading = props.index === 0 ? "h1" : "h2";
const live = props.block.live === true;
const liveUrl = live ? `/api/astral/posts?${new URLSearchParams({ locale: props.locale, limit: String(limit), ...(category ? { category } : {}) })}` : null;

if (live) useHead({ script: [{ key: "astral-live-list", type: "module", innerHTML: liveList, tagPosition: "bodyClose" }] });
</script>

<template>
  <section class="block block-postlist postlist" :data-block="block.key">
    <div class="container">
      <div v-if="block.title || block.text" class="block__head">
        <component :is="heading" v-if="block.title">{{ block.title }}</component>
        <p v-if="block.text" class="lede">{{ block.text }}</p>
      </div>
      <astral-live-list :data-url="liveUrl" :data-locale="locale" :data-loading="ui.loading">
        <ul v-if="posts.length" class="post-grid">
          <li v-for="post in posts" :key="post.id">
            <PostCard :post="post" :locale="locale" />
          </li>
        </ul>
        <p v-else class="empty">{{ ui.noPosts }}</p>
      </astral-live-list>
      <p v-if="block.link?.url" class="postlist__foot">
        <a class="arrow-link" :href="block.link.url">{{ block.link.label }}</a>
      </p>
    </div>
  </section>
</template>
