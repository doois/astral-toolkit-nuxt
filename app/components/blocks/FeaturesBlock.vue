<script setup lang="ts">
import type { Block } from "#shared/astral/index";
import type { Link } from "#shared/site/content";
import CmsIcon from "../CmsIcon.vue";

type Feature = { icon: string | null; title: string; text: string | null; link: Link | null };
const props = defineProps<{ block: Block<{ title: string | null; text: string | null; items: Feature[] | null; columns: string | null }>; locale: string; index: number }>();
const columns = ["2", "3", "4"].includes(props.block.columns ?? "") ? props.block.columns : "3";
const heading = props.index === 0 ? "h1" : "h2";
</script>

<template>
  <section class="block block-features features" :data-block="block.key">
    <div class="container">
      <div v-if="block.title || block.text" class="block__head">
        <component :is="heading" v-if="block.title">{{ block.title }}</component>
        <p v-if="block.text" class="lede">{{ block.text }}</p>
      </div>
      <ul :class="['features__grid', `features__grid--${columns}`]">
        <li v-for="(item, i) in block.items ?? []" :key="i" class="feature">
          <CmsIcon :name="item.icon" />
          <h3>{{ item.title }}</h3>
          <p v-if="item.text">{{ item.text }}</p>
          <a v-if="item.link?.url" class="arrow-link" :href="item.link.url" :target="item.link.newTab ? '_blank' : undefined" :rel="item.link.newTab ? 'noopener' : undefined">{{ item.link.label }}</a>
        </li>
      </ul>
    </div>
  </section>
</template>
