<script setup lang="ts">
// The 404 (and any other error), in the default locale, inside the site's own
// header and footer. Never indexed.
import config from "#astral/config";
import type { NuxtError } from "#app";
import { fillPattern } from "#shared/astral/index";
import type { SiteData } from "#shared/site/content";
import { localeName, t } from "#shared/site/i18n";
import SiteDocument from "./components/SiteDocument.vue";

const props = defineProps<{ error: NuxtError }>();
const locale = config.format.defaultLocale;
const ui = t(locale);
const notFound = props.error.statusCode === 404;
const homes = config.format.locales.map((l) => ({ locale: l, url: fillPattern("/", { slug: "", locale: l }, config.format) }));
const { data: site } = await useFetch<SiteData>("/api/astral/site", { key: `astral:site:${locale}`, query: { locale } });
</script>

<template>
  <SiteDocument v-if="site" :site="site" :locale="locale" :title="notFound ? ui.notFoundTitle : String(error.statusCode)" :noindex="true">
    <div class="container not-found">
      <p class="eyebrow">{{ error.statusCode }}</p>
      <h1>{{ notFound ? ui.notFoundTitle : error.statusMessage || "Erro" }}</h1>
      <p class="lede">{{ notFound ? ui.notFoundText : "" }}</p>
      <p>
        <template v-for="(home, i) in homes" :key="home.locale">
          <template v-if="i > 0"> · </template>
          <a :href="home.url" :hreflang="home.locale" :lang="home.locale">{{ home.locale === locale ? ui.backHome : localeName(home.locale) }}</a>
        </template>
      </p>
    </div>
  </SiteDocument>
  <div v-else class="container not-found">
    <p class="eyebrow">{{ error.statusCode }}</p>
    <h1>{{ notFound ? ui.notFoundTitle : "Erro" }}</h1>
  </div>
</template>
