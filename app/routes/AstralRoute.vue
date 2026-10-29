<script setup lang="ts">
// Every generated route renders here: modules/astral.ts adds this component once
// per type, locale and kind ("/en/blog/:slug"), named by the route id, so the
// route table (#astral/config) says what to fetch and how to cache it.
import EntryTemplate from "../components/templates/EntryTemplate.vue";
import ListingTemplate from "../components/templates/ListingTemplate.vue";

const result = await useAstralPage();
</script>

<template>
  <template v-if="result">
    <EntryTemplate v-if="result.page.view === 'entry'" :view="result.page" :site="result.site" />
    <ListingTemplate v-else :view="result.page" :site="result.site" />
  </template>
</template>
