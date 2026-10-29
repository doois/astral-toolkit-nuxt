# astral.convert.md

Read by the CMS's code-conversion job: how this toolkit is laid out and what a
conversion may change. Nuxt 4 (Vue 3, `<script setup lang="ts">`), TypeScript
strict, plain CSS (no Tailwind, no preprocessor, no `!important`, no scoped
`<style>` blocks), server-rendered HTML with no client JavaScript except the
`postlist` live island. Components read data from props only; all CMS access
happens on the server (`server/`), never in components.

## Writable paths

- `app/components/blocks/`
- `app/components/templates/`
- `app/components/SiteDocument.vue`
- `app/components/SiteHeader.vue`
- `app/components/SiteFooter.vue`
- `app/components/PostCard.vue`
- `app/components/PagePagination.vue`
- `app/components/CmsIcon.vue`
- `app/assets/styles/`
- `public/fonts/`
- `public/favicon.svg`
- `shared/site/i18n.ts`
- `astral.model.json`

## Tokens

`app/assets/styles/tokens.css`: every color (`--paper*`, `--ink*`, `--accent*`,
`--line*`, `--focus`; light on `:root`, dark under
`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and
`:root[data-theme="dark"]`), fonts (`--font-text`, `--font-display`, `--font-mono`),
type scale (`--text-xs` to `--text-4xl`), line heights and tracking, spacing
(`--space-1` to `--space-9`, `--section`, `--gutter`), widths (`--container`,
`--container-narrow`, `--measure`, `--header-height`), radius (`--radius-sm` to
`--radius-full`) and motion (`--ease`, `--dur`, `--dur-slow`). A re-brand changes this
file first; keep `--ink` and `--accent` on `--paper` at 4.5:1 or more in both schemes.
Global styles: `base.css` (fonts, reset, headings, `.prose`, `.button`, utilities) and
`layout.css` (header, footer, listing, post, 404); all imported by `index.css` and
inlined in the HTML (keep the total under 32 kB).

## Blocks

- One file per CMS component in `app/components/blocks/`, named `<Name>Block.vue`
  (`hero` is `HeroBlock.vue`, `mediatext` is `MediaTextBlock.vue`). Props:
  `{ block, locale, index }` (`postlist` also gets `posts`); `index === 0` gets `h1`,
  the rest `h2`.
- Registration: `app/components/blocks/BlocksRenderer.vue`, an explicit import plus an
  entry in `REGISTRY` (component apiId to component). Unregistered components are skipped.
- Images through `CmsImage.vue` (`media`, `sizes`, optional `priority`, `alt`);
  `richtext` fields only through `v-html`; other fields as text.
- Wrapper `<section class="block block-<apiId> <apiId>" :data-block="block.key">` with a
  `.container` inside; styles in one commented section of `app/assets/styles/blocks.css`.

Steps for a component `pricing` (`title`, repeatable `plans` with `name`, `price`):

```vue
<script setup lang="ts">
import type { Block } from "#shared/astral/index";

const props = defineProps<{ block: Block<{ title: string | null; plans: { name: string; price: string }[] | null }>; locale: string; index: number }>();
const heading = props.index === 0 ? "h1" : "h2";
</script>

<template>
  <section class="block block-pricing pricing" :data-block="block.key">
    <div class="container">
      <div v-if="block.title" class="block__head"><component :is="heading">{{ block.title }}</component></div>
      <ul class="pricing__grid">
        <li v-for="(plan, i) in block.plans ?? []" :key="i" class="plan"><h3>{{ plan.name }}</h3><span class="plan__price">{{ plan.price }}</span></li>
      </ul>
    </div>
  </section>
</template>
```

Then `import PricingBlock from "./PricingBlock.vue";` and `pricing: PricingBlock,` in
`BlocksRenderer.vue`, a `/* Pricing */` section in `blocks.css`, and the component in
`astral.model.json` (`components[]`, plus its apiId in the `blocks` field of `home` and `page`).

## Layouts

- `app/components/SiteDocument.vue`: the page shell. Head (`useHead`/`useSeoMeta`:
  title, description, canonical, hreflang, Open Graph, JSON-LD), skip link, header,
  `banner` slot, `<main id="content">`, footer.
- `app/components/SiteHeader.vue`: brand (`settings.logo` or `.brand__mark` plus the
  site name), the `header` menu, the language switcher, the `<details>` mobile menu.
- `app/components/SiteFooter.vue`: about, the `footer` menu, social links, footer text.
- Page templates in `app/components/templates/`: `HomeTemplate.vue`,
  `PageTemplate.vue`, `PostTemplate.vue`, `ListingTemplate.vue`; `EntryTemplate.vue`
  picks one by `entry.type`.

## Assets

- Fonts: `public/fonts/*.woff2`, declared with `@font-face` at the top of
  `app/assets/styles/base.css` (`url("/fonts/<file>.woff2")`); the text face is
  preloaded in `app/components/SiteDocument.vue` (`useHead` link). Replace the files, the `@font-face`
  blocks and the preload href together; display faces keep `font-display: swap`.
- Logo: from the CMS (`settings.logo`), not a file in the repository. Favicon:
  `public/favicon.svg`. Feature icons: inline SVG paths in `app/components/CmsIcon.vue`.
- Images in content always come from the CMS; nothing is added to `public/` for them.

## Pages

Do not touch: `shared/astral/` (the client, synced from the CMS), `shared/site/routes.ts`,
`shared/site/content.ts`, `modules/`, `app/routes/`, `app/pages/`, `app/error.vue`,
`app/app.vue`, `app/composables/`, `app/assets/live-list.js`, `app/components/CmsImage.vue`,
`app/components/JsonLd.vue`, `server/` (data, cache, revalidation, sitemap, robots),
`scripts/`, `package.json`, `package-lock.json`, `tsconfig.json`, `lighthouserc.json`,
`.github/`, `.env`, `.env.example`.

## Notes

Class names are shared by every Astral toolkit (see `DESIGN.md` in the Astro
toolkit); keep them when restyling. No em dashes in UI text.
