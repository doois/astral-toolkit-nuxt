# Astral toolkit: Nuxt

Site inicial em [Nuxt](https://nuxt.com) (Vue) para o Astral (CMS headless da Doois):
cliente tipado, blocos, menus, idiomas, imagens responsivas, SEO, JSON-LD, sitemap,
pré-visualização de rascunhos, revalidação por webhook e status de build. É o
ponto de partida de um site novo: o instalador do CMS cria o repositório do site a
partir deste template, aplica o `astral.model.json` ao projeto e preenche o `.env`.

É o mesmo site do toolkit Astro (`doois/astral-toolkit-astro`): mesmo modelo, mesma
marcação classe por classe e o mesmo CSS (o `DESIGN.md` de lá descreve os tokens e a
marcação de cada bloco). Muda só a forma idiomática de cada framework.

## O que vem

| Pasta | O quê |
|---|---|
| `astral.model.json` | O modelo do site (componentes, tipos, taxonomia, menus), no formato de proposta do CMS |
| `shared/astral/` | O cliente JavaScript do Astral (copiado do repositório do CMS por `npm run toolkits:sync`; não edite aqui) |
| `shared/site/` | `routes.ts` (tabela de rotas), `i18n.ts` (textos de interface), `content.ts` (tipos do conteúdo e das respostas) |
| `modules/astral.ts` | Módulo Nuxt: lê o `/schema` do CMS ao carregar a configuração e gera rotas, route rules, lista de pré-renderização e redirecionamentos |
| `app/routes/AstralRoute.vue` | O componente de todas as rotas geradas |
| `app/components/blocks/` | Um componente Vue por componente do CMS, mais o `BlocksRenderer.vue` que os monta |
| `app/components/templates/` | Página inicial, página, post, listagem, e o `EntryTemplate.vue` que escolhe por tipo |
| `app/components/` | `SiteDocument.vue` (head, cabeçalho, rodapé), `SiteHeader.vue`, `SiteFooter.vue`, `CmsImage.vue`, `PostCard.vue`, `PagePagination.vue`, `CmsIcon.vue`, `JsonLd.vue` |
| `app/pages/preview.vue`, `app/error.vue` | Pré-visualização e 404 |
| `app/assets/styles/` | Tokens, base, layout e blocos, em CSS puro (os mesmos arquivos do Astro), mais `nuxt.css` |
| `server/lib/` | `cms.ts` (leituras do CMS com memo e tags), `resolve.ts`, `memo.ts`, `env.ts` |
| `server/api/astral/` | `page`, `site`, `preview`, `posts` (dados das páginas e da ilha) e `revalidate` (webhook) |
| `server/routes/` | `sitemap.xml` e `robots.txt` |
| `server/utils/page-cache.ts` | Purga das páginas `revalidate` no cache do Nitro |
| `scripts/` | `build.mjs` (build com status para o CMS), `seed-demo.mjs` (modelo e conteúdo de demonstração), `demo-assets/` |
| `lighthouserc.json`, `.github/workflows/lighthouse.yml` | Lighthouse CI com mínimo 95 em todas as categorias |
| `astral.convert.md` | Guia lido pelo CMS ao converter o código de um site para este toolkit |

## Configuração

Copie `.env.example` para `.env` e preencha (nunca versione o `.env`):

| Variável | O quê |
|---|---|
| `ASTRAL_URL` | Endereço do CMS, como `https://cms.doois.com.br` |
| `ASTRAL_PROJECT` | Slug do projeto |
| `ASTRAL_TOKEN` | Chave de leitura (`cms_xxxxxxxx_...`), com `entries:*:read`, `entries:*:preview` e `media.read` |
| `ASTRAL_WEBHOOK_SECRET` | Segredo do webhook do projeto que aponta para `<site>/api/astral/revalidate` |
| `ASTRAL_BUILD_WEBHOOK_ID` | Opcional: id desse webhook, para o build reportar o status ao CMS |
| `SITE_URL` | Endereço público do site |
| `ASTRAL_REBUILD_HOOK` | Opcional: URL chamada (POST) quando o site precisa ser reconstruído |
| `ASTRAL_LOCALE_URLS` | Opcional: formato das URLs por idioma enquanto o `/schema` não entregar `localeUrls` (`prefix`, `prefix-all`, `domain`, `none`) |
| `ASTRAL_BUILD_LOCALES` | Opcional: só estes idiomas neste build (formatos `domain` e `none`, um build por idioma) |
| `PORT`, `HOST` | Porta e interface do servidor Node (padrão 3000) |

Os nomes seguem o contrato dos toolkits, por isso são lidos direto de `process.env`
(no build, o Nuxt carrega o `.env`; em produção, `npm start` também lê o `.env` quando
ele existe) e não pelo `runtimeConfig` com prefixo `NUXT_`.

No CMS, em Configurações do projeto: endereço do site (`SITE_URL`) e endereço de
pré-visualização `https://<site>/preview?token={token}`.

```sh
npm install
npm run dev        # http://localhost:3000, lendo o CMS a cada pedido
npm run build      # scripts/build.mjs: nuxt build + status para o CMS
npm start          # o servidor Node (.output/server/index.mjs)
npm run generate   # site todo estático (nuxt generate) + status para o CMS
npm run check      # tipos (nuxt typecheck)
npm run lhci       # Lighthouse CI no build (precisa de um build antes)
```

## Como as rotas e os modos de renderização funcionam

Ao carregar a configuração, `modules/astral.ts` lê `GET /api/<projeto>/schema` e os
redirecionamentos e, para cada tipo com `urlPattern` e cada idioma, cria uma rota no
formato de URL do projeto: `/blog/:slug` e `/en/blog/:slug`, a listagem `/blog` com
páginas em `/blog/pagina/:page` (`/en/blog/page/:page`) e o arquivo de cada taxonomia
com URL (`/blog/categoria/:slug`). Todas usam o mesmo componente
(`app/routes/AstralRoute.vue`), com o id da rota como nome. A tabela fica no módulo
gerado `#astral/config` (idiomas, formato, tipos, taxonomias), lido pelo app e pelo
servidor.

O formato das URLs vem do `/schema` (`localeUrls` e `localeDomains`). Enquanto o CMS
não entregar esses campos, vale `ASTRAL_LOCALE_URLS` e, sem ela, `prefix`.

O `render` de cada tipo (opção do tipo no CMS; ausente vale `static`) vira uma route
rule do Nitro, gerada no mesmo momento:

| `render` | Route rule | Quando o conteúdo muda |
|---|---|---|
| `static` | `prerender: true`; a lista de caminhos vem do CMS no início do build (entradas, páginas de listagem, termos) | o webhook pede um rebuild (`ASTRAL_REBUILD_HOOK`) |
| `revalidate` | `cache: { swr: true, maxAge: 1 ano, staleMaxAge: 1 dia }`: renderizada na primeira visita e guardada no cache do Nitro, com `Cache-Control: s-maxage=31536000, stale-while-revalidate=86400` e `Cache-Tag` | o webhook apaga do cache do Nitro só os caminhos e tags do evento; a próxima visita renderiza de novo |
| `dynamic` | `cache: false` (SSR a cada pedido) e `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=600` | nada a fazer |

As listagens e arquivos de categoria seguem o modo da coleção (o mais dinâmico, se uma
taxonomia classificar coleções de modos diferentes). Todas as páginas têm ainda
`noScripts: true` (veja "JavaScript" abaixo).

Decisões, ditas com clareza:

- **Dados só no servidor.** Os componentes nunca chamam o CMS: cada página pede
  `GET /api/astral/page` (rota do Nitro, chamada em processo durante a renderização,
  sem HTTP), que responde com a página, as configurações, os menus, o JSON-LD do site,
  os posts dos blocos `postlist` e as tags de cache. A chave do CMS e o memo das
  respostas ficam no Nitro, onde o webhook consegue purgar.
- **`isr` x `swr`.** No Nitro com o preset `node-server`, `isr` não tem efeito (é para
  Vercel e Netlify); o equivalente é `swr` com `maxAge` longo, que é o que o módulo gera.
  Numa hospedagem com ISR nativo, troque a regra em `ruleOf` (`modules/astral.ts`).
- **Purga por caminho e por tag.** O Nitro guarda cada resposta `revalidate` em
  `cache:nitro:routes:*` com os cabeçalhos. A página acrescenta `x-astral-path` e
  `cache-tag`; o webhook lê esses cabeçalhos das entradas guardadas e remove as que
  batem (`server/utils/page-cache.ts`). Assim a purga não depende de como o Nitro
  calcula as chaves. O cache padrão é a memória do processo; com mais de um container,
  monte o storage `cache` num Redis (`nitro.storage`) e todos compartilham as páginas
  e a purga.
- **Estático é arquivo.** Depois do build, um endereço de rota `static` que não foi
  pré-renderizado é 404 direto (sem consultar o CMS), como num host estático e como no
  toolkit Astro. No `npm run dev` tudo renderiza sob demanda.
- **CMS fora do ar não derruba o site.** As respostas do CMS ficam em memória
  (`server/lib/memo.ts`, 5 minutos, purgadas pelo webhook) e a última resposta boa de
  cada consulta é guardada à parte. Se o CMS falhar (rede, 5xx depois das novas
  tentativas do cliente), o site serve essa resposta e tenta de novo 30 segundos
  depois; só dá erro uma consulta que nunca carregou desde que o processo subiu.
- **404 não entra em cache.** Os cabeçalhos de `revalidate` e `dynamic` são definidos
  pela página só quando ela renderiza; um 404 sai sem cache compartilhado.
- Uma página `static` que embute conteúdo de um tipo `revalidate` (a home com a lista
  de posts) só muda no próximo build. Para mostrar o conteúdo novo antes disso, o
  bloco `postlist` tem a opção `live` (veja abaixo).
- A tabela de rotas é decidida no build. Um tipo novo com URL, um idioma novo ou um
  `render` diferente pedem um rebuild (o evento `schema.updated` pede um).
- Nos formatos `domain` e `none` todos os idiomas têm os mesmos caminhos: faça um build
  por idioma (`ASTRAL_BUILD_LOCALES=en`), um por domínio. `prefix` (padrão) e
  `prefix-all` saem num build só.

## JavaScript

Nenhuma página carrega o JavaScript do Nuxt: a route rule `noScripts` tira o
runtime do Vue, o payload e os `modulepreload`, e o CSS (um arquivo, menos de 32 kB)
vai embutido no HTML. O HTML é renderizado no servidor e não hidrata. O menu mobile e o
FAQ são `<details>`, sem script. O Nuxt acrescenta um `<script type="speculationrules">`
(JSON, não JavaScript) que pede ao navegador para pré-carregar os links internos ao
passar o mouse.

A única parte interativa é a ilha do bloco `postlist` com `live: true`: a lista vem do
servidor no HTML e um elemento `<astral-live-list>` de menos de 1 kB
(`app/assets/live-list.js`, embutido só nas páginas que têm o bloco) busca a versão
atual em `/api/astral/posts`, que guarda a chave do CMS no servidor. Se a busca falhar,
a lista do servidor fica como está. Não há Vue no navegador para isso: uma ilha Vue
(`<NuxtIsland>` ou componente `.client`) traria o runtime inteiro (mais de 70 kB),
acima do orçamento de 30 kB do contrato.

## Revalidação, purga e rebuild

O CMS chama `POST /api/astral/revalidate` em cada mudança (webhook do projeto com os
eventos de conteúdo, mídia, menus, configurações, taxonomias e schema). O endpoint
confere `x-cms-timestamp` e `x-cms-signature` com o `verifyWebhook` do cliente
(HMAC-SHA256 de `timestamp.corpo` com `ASTRAL_WEBHOOK_SECRET`, janela de 5 minutos) e
então:

1. apaga do cache do Nitro as páginas dos caminhos do evento (`data.paths`) e as que
   têm uma das tags (`data.tags`: `type:post`, `entry:<id>`, ...), e as respostas do
   CMS memorizadas com essas tags;
2. se mudou um tipo `static`, ou algo que toda página usa (menus, configurações, schema,
   taxonomias), apaga todo o cache e chama `ASTRAL_REBUILD_HOOK` (POST com
   `{ event_type, reason, at }`);
3. no evento `site.rebuild` (botão "Reconstruir site" do painel), chama o hook direto.

A resposta diz o que foi feito: `{ ok, event, purged, paths, tags, rebuild: "requested" | "no_hook" | "not_needed" | "failed" }`.

Com um CDN na frente (Cloudflare, Bunny), as páginas `revalidate` já saem com
`s-maxage` longo e `Cache-Tag`. Para purgar também no CDN, chame a API de purga dele no
mesmo ponto em que `requestRebuild` é chamado em `server/api/astral/revalidate.post.ts`,
com os mesmos `paths` ou `tags`.

## Status de build

`npm run build` (e `npm run generate`) roda `scripts/build.mjs`: com
`ASTRAL_BUILD_WEBHOOK_ID` e `ASTRAL_WEBHOOK_SECRET` definidos, envia `building` antes
do `nuxt build` e `success` (com `SITE_URL`) ou `failed` (com o motivo) depois,
assinados como um webhook, para `POST /api/<projeto>/webhooks/<id>/status`. O painel
mostra o estado; uma falha avisa por e-mail quem cuida do site. Sem as variáveis, é só
um `nuxt build`.

## Deploy

### Container Node (Dokploy)

1. Crie a aplicação a partir do repositório (Nixpacks ou o Dockerfile abaixo); build
   `npm ci && npm run build`, start `npm start`, porta `3000`.
2. Variáveis de ambiente: as do `.env.example`. O build precisa das do CMS (lê o schema
   e pré-renderiza); o container precisa de todas em tempo de execução.
3. `ASTRAL_REBUILD_HOOK` = o webhook de deploy da aplicação no Dokploy. Assim uma
   publicação de conteúdo estático dispara o redeploy, e o build reporta o status ao CMS.
4. No CMS: webhook do projeto para `https://<site>/api/astral/revalidate` com todos os
   eventos de conteúdo; copie o segredo para `ASTRAL_WEBHOOK_SECRET` e o id para
   `ASTRAL_BUILD_WEBHOOK_ID`.

```Dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
ARG ASTRAL_URL ASTRAL_PROJECT ASTRAL_TOKEN ASTRAL_WEBHOOK_SECRET ASTRAL_BUILD_WEBHOOK_ID SITE_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

O `.output` é autossuficiente (traz o próprio `node_modules`): a imagem final não
precisa do código nem das dependências do projeto.

### Hospedagem estática (site todo `static`)

Deixe todos os tipos com `render` `static` no CMS, rode `npm run generate` e publique
`.output/public` (Cloudflare Pages, Netlify, nginx com `try_files $uri $uri/index.html`).
Cada página é `<caminho>/index.html`. Sem servidor não há `preview`, `revalidate`,
`api/astral/*` nem ilha `live`, e os redirecionamentos do CMS precisam ir para o host
(`_redirects` ou regra do servidor). Aponte o webhook do CMS, com "Agrupar eventos"
(60 s), para o hook de deploy do host em vez do endpoint do site.

## Idiomas

O projeto define os idiomas e o formato das URLs (Configurações › Idiomas). O cliente
entrega tudo já nesse formato (`meta.url`, menus, termos, sitemap); o site só precisa
servir as rotas, o que o módulo faz. Os textos de interface do próprio site (paginação,
"Ler mais", 404) ficam em `shared/site/i18n.ts`: acrescente um idioma lá quando o
projeto ganhar um. O seletor de idioma usa `meta.alternates` do conteúdo e cai para a
home do idioma quando a página não tem tradução.

## SEO e performance

- `<title>`, descrição, canônica, `hreflang` (com `x-default`), Open Graph e o JSON-LD
  do site (`/jsonld`: Organization e WebSite) em toda página, por `useHead` e
  `useSeoMeta` em `SiteDocument.vue`; `BlogPosting` nos posts (do CMS quando o tipo tem
  dados estruturados mapeados, senão montado aqui); `FAQPage` no bloco de perguntas.
- `sitemap.xml` vem pronto do CMS (precisa do endereço do site no projeto; sem ele, é
  montado aqui com `SITE_URL`). `robots.txt` bloqueia `/preview` e `/api/`. Os dois são
  pré-renderizados.
- Zero JavaScript por padrão; CSS embutido; fontes auto-hospedadas, só a de texto
  pré-carregada; imagens com `<img>` e os atributos de `imageAttrs` do cliente (o CMS já
  entrega o `srcset` em WebP, por isso não há `@nuxt/image`): `width`/`height` sempre,
  a primeira `eager` com `fetchpriority="high"` e as demais `lazy`.
- Lighthouse CI (`lighthouserc.json`): o workflow do GitHub constrói o site com os
  segredos do repositório (`ASTRAL_URL`, `ASTRAL_PROJECT`, `ASTRAL_TOKEN`) e falha
  abaixo de 95 em qualquer categoria. Localmente, `npx lhci collect && npx lhci assert`
  roda sem enviar o relatório para fora.

## Como adicionar um bloco

1. No CMS, crie o componente (por exemplo `pricing`) e acrescente-o à lista de blocos
   dos tipos `home` e `page` (ou edite `astral.model.json` e rode o seed numa instalação nova).
2. Crie `app/components/blocks/PricingBlock.vue` recebendo `{ block, locale, index }`;
   use `index === 0` para decidir entre `h1` e `h2`, `CmsImage.vue` para imagens e
   `v-html` só em campos `richtext` (já sanitizados pelo CMS; veja `shared/astral/richtext.ts`).
3. Registre em `app/components/blocks/BlocksRenderer.vue` (`pricing: PricingBlock`) e
   escreva o CSS em `app/assets/styles/blocks.css` seguindo a marcação do `DESIGN.md`
   do toolkit Astro, para os outros toolkits poderem copiar.

Um bloco que o site não conhece é ignorado na renderização (com aviso no dev), então
criar o componente no CMS antes do código nunca quebra o build.

## Demonstração

`scripts/seed-demo.mjs` aplica o modelo e um conteúdo fictício (o estúdio "Vértice",
pessoas e clientes inventados, imagens geradas) a um projeto, pelo admin API:

```sh
ASTRAL_ADMIN_API=https://cms.exemplo.com/admin-api \
ASTRAL_ADMIN_EMAIL=... ASTRAL_ADMIN_PASSWORD=... \
ASTRAL_SEED_PROJECT=astral-demo ASTRAL_SEED_SITE_URL=http://localhost:3000 \
node scripts/seed-demo.mjs --write-env .env
```

Cria o projeto se não existir, a chave de leitura e o webhook, e com `--write-env`
escreve o `.env` do site. Rodar de novo atualiza em vez de duplicar; `--prune` remove
de um projeto existente o que o modelo não define. O script nunca imprime segredos.

## Cliente

`shared/astral/` é copiado do repositório do CMS (`toolkits/client`, testado lá com
100% de cobertura). `createClient({ url, project, token })` expõe `list`, `listAll`,
`get`, `single`, `menu`, `menus`, `terms`, `term`, `schema`, `sitemap`, `sitemapXml`,
`jsonLd`, `redirects`, `analytics`, `preview`, com erros tipados e nova tentativa em
erros de rede e 5xx. Ajudantes: `renderMode`, `pathOf`, `localeFormat`, `routePattern`,
`localeOfPath`, `imageAttrs`, `verifyWebhook`, `signBody`, `tagsOf`, `pathsOf`.
