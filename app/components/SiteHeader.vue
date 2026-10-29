<script setup lang="ts">
// Brand, the "header" menu from the CMS and the language switcher. The mobile
// menu is a <details>: it opens and closes without JavaScript.
import config from "#astral/config";
import type { Menu, MenuItem } from "#shared/astral/index";
import type { Settings } from "#shared/site/content";
import { localeName, t } from "#shared/site/i18n";

const props = defineProps<{
  locale: string;
  settings: Settings;
  menu: Menu;
  alternates: { locale: string; url: string | null }[];
  currentPath: string;
  homeOf: (locale: string) => string;
}>();

const ui = t(props.locale);
const siteName = props.settings.siteName;
const logo = props.settings.logo;

const norm = (url: string | null | undefined) => (url ? url.replace(/^https?:\/\/[^/]+/, "").replace(/\/+$/, "") || "/" : "");
const isCurrent = (item: MenuItem) => {
  const url = norm(item.url);
  if (!url || url === "#") return false;
  if (url === props.currentPath) return true;
  // An archive owns the pages under it ("/blog" is current on "/blog/post").
  return item.kind === "archive" && props.currentPath.startsWith(`${url}/`);
};
const locales = config.format.locales.map((l) => ({ locale: l, href: props.alternates.find((a) => a.locale === l)?.url ?? props.homeOf(l), current: l === props.locale }));
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" :href="homeOf(locale)" :aria-label="siteName">
        <img v-if="logo" class="brand__logo" :src="logo.url" alt="" :width="logo.width ?? undefined" :height="logo.height ?? undefined" />
        <span v-else class="brand__mark" aria-hidden="true" />
        <span v-if="!logo">{{ siteName }}</span>
      </a>
      <nav class="nav" :aria-label="ui.menu">
        <ul class="nav__list">
          <li v-for="item in menu.items" :key="item.id">
            <a class="nav__link" :href="item.url ?? '#'" :target="item.newTab ? '_blank' : undefined" :rel="item.newTab ? 'noopener' : undefined" :aria-current="isCurrent(item) ? 'page' : undefined">{{ item.label }}</a>
          </li>
        </ul>
        <ul v-if="locales.length > 1" class="locale-switch" :aria-label="ui.language">
          <li v-for="l in locales" :key="l.locale">
            <a :href="l.href" :hreflang="l.locale" :lang="l.locale" :aria-current="l.current ? 'true' : undefined" :title="localeName(l.locale)">{{ l.locale.split("-")[0] }}</a>
          </li>
        </ul>
        <details v-if="menu.items.length > 0" class="nav__toggle">
          <summary :aria-label="ui.menu">{{ ui.menu }}</summary>
          <div class="nav__panel">
            <ul class="nav__list">
              <li v-for="item in menu.items" :key="item.id">
                <a class="nav__link" :href="item.url ?? '#'" :aria-current="isCurrent(item) ? 'page' : undefined">{{ item.label }}</a>
              </li>
            </ul>
          </div>
        </details>
      </nav>
    </div>
  </header>
</template>
