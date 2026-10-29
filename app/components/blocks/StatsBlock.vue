<script setup lang="ts">
import type { Block } from "#shared/astral/index";

type Stat = { value: string; label: string };
const props = defineProps<{ block: Block<{ title: string | null; items: Stat[] | null }>; locale: string; index: number }>();
const heading = props.index === 0 ? "h1" : "h2";
</script>

<template>
  <section class="block block-stats stats" :data-block="block.key">
    <div class="container">
      <div v-if="block.title" class="block__head">
        <component :is="heading">{{ block.title }}</component>
      </div>
      <ul class="stats__grid">
        <li v-for="(item, i) in block.items ?? []" :key="i" class="stat">
          <span class="stat__value">{{ item.value }}</span>
          <span class="stat__label">{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
