<script setup lang="ts">
import { t } from "#shared/site/i18n";
import { pagedUrl } from "#shared/site/routes";

const props = defineProps<{ page: number; pageCount: number; base: string; locale: string }>();
const ui = t(props.locale);
</script>

<template>
  <nav v-if="pageCount > 1" class="pagination" :aria-label="ui.page(page, pageCount)">
    <a v-if="page > 1" :href="pagedUrl(base, page - 1, locale)" rel="prev">← {{ ui.previous }}</a>
    <span v-else aria-disabled="true">← {{ ui.previous }}</span>
    <span class="pagination__status">{{ ui.page(page, pageCount) }}</span>
    <a v-if="page < pageCount" :href="pagedUrl(base, page + 1, locale)" rel="next">{{ ui.next }} →</a>
    <span v-else aria-disabled="true">{{ ui.next }} →</span>
  </nav>
</template>
