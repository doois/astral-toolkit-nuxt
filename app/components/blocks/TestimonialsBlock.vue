<script setup lang="ts">
import type { Block, Media } from "#shared/astral/index";
import CmsImage from "../CmsImage.vue";

type Testimonial = { quote: string; name: string; role: string | null; photo: Media | null };
const props = defineProps<{ block: Block<{ title: string | null; items: Testimonial[] | null }>; locale: string; index: number }>();
const heading = props.index === 0 ? "h1" : "h2";
</script>

<template>
  <section class="block block-testimonials testimonials" :data-block="block.key">
    <div class="container">
      <div v-if="block.title" class="block__head">
        <component :is="heading">{{ block.title }}</component>
      </div>
      <ul class="testimonials__grid">
        <li v-for="(item, i) in block.items ?? []" :key="i">
          <figure class="testimonial">
            <blockquote>{{ item.quote }}</blockquote>
            <figcaption>
              <CmsImage v-if="item.photo" :media="item.photo" sizes="40px" alt="" />
              <span>
                <strong>{{ item.name }}</strong>
                {{ item.role }}
              </span>
            </figcaption>
          </figure>
        </li>
      </ul>
    </div>
  </section>
</template>
