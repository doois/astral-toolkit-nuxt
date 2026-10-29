<script setup lang="ts">
import type { Menu } from "#shared/astral/index";
import type { Settings } from "#shared/site/content";
import { t } from "#shared/site/i18n";

const props = defineProps<{ locale: string; settings: Settings; menu: Menu; homeOf: (locale: string) => string }>();

const ui = t(props.locale);
const social = (props.settings.social ?? []).filter((s) => s.url && s.label);
const year = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__grid">
        <div class="site-footer__about">
          <a class="brand" :href="homeOf(locale)">{{ settings.siteName }}</a>
          <p v-if="settings.description">{{ settings.description }}</p>
          <p v-if="settings.contactEmail">
            <a :href="`mailto:${settings.contactEmail}`">{{ settings.contactEmail }}</a>
          </p>
        </div>
        <nav v-if="menu.items.length > 0" :aria-label="menu.name">
          <h3>{{ menu.name }}</h3>
          <ul>
            <li v-for="item in menu.items" :key="item.id">
              <a :href="item.url ?? '#'" :target="item.newTab ? '_blank' : undefined" :rel="item.newTab ? 'noopener' : undefined">{{ item.label }}</a>
            </li>
          </ul>
        </nav>
        <div v-if="social.length > 0">
          <h3>Social</h3>
          <ul>
            <li v-for="s in social" :key="s.url">
              <a :href="s.url" :target="s.newTab ? '_blank' : undefined" :rel="s.newTab ? 'noopener' : undefined">{{ s.label }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        <span>{{ settings.footerText || `${settings.siteName}, ${year}` }}</span>
        <a :href="homeOf(locale)">{{ ui.home }}</a>
      </div>
    </div>
  </footer>
</template>
