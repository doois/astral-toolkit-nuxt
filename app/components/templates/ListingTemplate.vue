<script setup lang="ts">
// The blog: a page of posts with the category filter (links, so the filter is
// crawlable and works without JavaScript) and pagination.
import type { ListingView, SiteData } from "#shared/site/content";
import { t } from "#shared/site/i18n";
import PagePagination from "../PagePagination.vue";
import PostCard from "../PostCard.vue";
import SiteDocument from "../SiteDocument.vue";

const props = defineProps<{ view: ListingView; site: SiteData }>();
const v = props.view;
const ui = t(v.locale);
const canonical = v.meta.page > 1 ? useRoute().path : v.base;
const title = v.meta.page > 1 ? `${v.title} (${ui.page(v.meta.page, v.meta.pageCount)})` : v.title;
</script>

<template>
  <SiteDocument :site="site" :locale="v.locale" :title="title" :description="v.description" :alternates="v.alternates" :canonical="canonical" :current-path="v.allUrl">
    <div class="container">
      <header class="page-header">
        <p class="eyebrow">{{ ui.blog }}</p>
        <h1>{{ v.title }}</h1>
        <p v-if="v.description" class="lede">{{ v.description }}</p>
      </header>
      <nav v-if="v.terms.length > 0" class="filters" :aria-label="ui.categories">
        <a :href="v.allUrl" :aria-current="v.current ? undefined : 'page'">{{ ui.allCategories }}</a>
        <a v-for="term in v.terms" :key="term.id" :href="term.url ?? v.allUrl" :aria-current="v.current?.id === term.id ? 'page' : undefined">
          {{ term.name }}<span v-if="typeof term.count === 'number'" class="visually-hidden"> ({{ term.count }})</span>
        </a>
      </nav>
      <ul v-if="v.posts.length" class="post-grid">
        <li v-for="post in v.posts" :key="post.id">
          <PostCard :post="post" :locale="v.locale" heading-level="h2" />
        </li>
      </ul>
      <p v-else class="empty">{{ ui.noPosts }}</p>
      <PagePagination :page="v.meta.page" :page-count="v.meta.pageCount" :base="v.base" :locale="v.locale" />
    </div>
  </SiteDocument>
</template>
