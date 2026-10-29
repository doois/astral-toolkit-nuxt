import config from "#astral/config";
import { imageAttrs } from "../../../shared/astral/index";
import { formatDate } from "../../../shared/site/i18n";
import { listPosts } from "../../lib/cms";

// Data for the live postlist island: the newest posts as ready-to-render cards.
// The CMS key stays on the server; the browser only ever talks to the site.
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const asked = String(query.locale ?? "");
  const locale = config.format.locales.includes(asked) ? asked : config.format.defaultLocale;
  const limit = Math.min(Math.max(Number(query.limit) || 3, 1), 12);
  const category = String(query.category ?? "").trim() || undefined;
  const { data } = await listPosts(locale, 1, category, limit);
  const cards = data.map((post) => {
    const category = post.category?.[0] ?? null;
    const cover = post.cover ? imageAttrs(post.cover, { sizes: "(min-width: 64em) 24rem, (min-width: 40em) 50vw, 100vw", alt: "" }) : null;
    return {
      url: post.meta.url,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      dateLabel: formatDate(post.date, locale),
      category: category ? { name: category.name, url: category.url } : null,
      cover: cover ? { src: cover.src, ...(cover.srcset ? { srcset: cover.srcset, sizes: cover.sizes } : {}), ...(cover.width ? { width: cover.width, height: cover.height } : {}), ...(cover.style ? { style: cover.style } : {}) } : null,
    };
  });
  setResponseHeader(event, "cache-control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
  return { data: cards };
});
