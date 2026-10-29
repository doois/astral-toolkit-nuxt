<script setup lang="ts">
// Each question is a <details>: expandable without JavaScript, and the answers
// are in the HTML for search engines. FAQPage structured data goes along.
import { hasRichText, plainText, type Block } from "#shared/astral/index";
import JsonLd from "../JsonLd.vue";

type Item = { question: string; answer: string | null };
const props = defineProps<{ block: Block<{ title: string | null; text: string | null; items: Item[] | null }>; locale: string; index: number }>();
const heading = props.index === 0 ? "h1" : "h2";
const items = (props.block.items ?? []).filter((item) => item.question);
const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: plainText(item.answer ?? "") } })) };
</script>

<template>
  <section v-if="items.length > 0" class="block block-faq faq" :data-block="block.key">
    <div class="container">
      <div v-if="block.title || block.text" class="block__head">
        <component :is="heading" v-if="block.title">{{ block.title }}</component>
        <p v-if="block.text" class="lede">{{ block.text }}</p>
      </div>
      <div class="faq__list">
        <details v-for="(item, i) in items" :key="i" class="faq__item">
          <summary>{{ item.question }}</summary>
          <div v-if="hasRichText(item.answer)" class="faq__answer prose" v-html="item.answer" />
        </details>
      </div>
    </div>
    <JsonLd :data="jsonLd" />
  </section>
</template>
