// The island behind <astral-live-list>: fetches the site's own JSON endpoint
// (server/api/astral/posts.get.ts, which holds the CMS key server-side) and
// rebuilds the cards. Under 1 kB, no framework, inlined only on pages with a
// live postlist (PostListBlock.vue). The server-rendered list stays as it is
// when the fetch fails, so the page never degrades. Same markup as PostCard.vue.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${esc(v)}"`).join(" ");
const card = (p) => `<li><article class="post-card">
  ${p.cover ? `<a class="post-card__media" href="${esc(p.url)}" tabindex="-1" aria-hidden="true"><img ${attrs(p.cover)} loading="lazy" decoding="async" alt=""></a>` : ""}
  <div class="post-card__meta">${p.date ? `<time datetime="${esc(p.date)}">${esc(p.dateLabel)}</time>` : ""}${p.category ? (p.category.url ? `<a href="${esc(p.category.url)}">${esc(p.category.name)}</a>` : `<span>${esc(p.category.name)}</span>`) : ""}</div>
  <h3 class="post-card__title"><a href="${esc(p.url)}">${esc(p.title)}</a></h3>
  ${p.excerpt ? `<p class="post-card__excerpt">${esc(p.excerpt)}</p>` : ""}
</article></li>`;
if (!customElements.get("astral-live-list"))
  customElements.define(
    "astral-live-list",
    class extends HTMLElement {
      connectedCallback() {
        const url = this.dataset.url;
        if (!url) return;
        this.dataset.state = "loading";
        this.setAttribute("aria-busy", "true");
        fetch(url, { headers: { accept: "application/json" } })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then((body) => {
            if (body.data.length) this.innerHTML = `<ul class="post-grid">${body.data.map(card).join("")}</ul>`;
          })
          .catch(() => undefined)
          .finally(() => {
            this.dataset.state = "ready";
            this.removeAttribute("aria-busy");
          });
      }
    },
  );
