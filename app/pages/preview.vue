<script setup lang="ts">
// Draft preview. The editor's "Preview" button opens this address with a signed
// token (the project's preview URL is "<site>/preview?token={token}"); the token
// is traded for the draft at the CMS, no API key involved. Never cached, never
// indexed, and the page says it is a draft.
import type { PreviewResult } from "#shared/site/content";
import { t } from "#shared/site/i18n";
import EntryTemplate from "../components/templates/EntryTemplate.vue";

const query = useRoute().query;
const token = String(query.token ?? query.preview ?? "");
const { data } = await useFetch<PreviewResult>("/api/astral/preview", { key: `astral:preview:${token}`, query: { token } });
const result = data.value ?? { ok: false as const, problem: "preview_failed" };

if (import.meta.server) {
  useResponseHeader("cache-control").value = "private, no-store";
  useResponseHeader("x-robots-tag").value = "noindex, nofollow";
  if (!result.ok) setResponseStatus(useRequestEvent()!, 401);
}
if (!result.ok) useHead({ htmlAttrs: { lang: "pt-BR" }, title: "Preview", meta: [{ name: "robots", content: "noindex" }] });
</script>

<template>
  <EntryTemplate v-if="result.ok" :view="result.page" :site="result.site" :preview="true">
    <template #banner>
      <div class="preview-banner" role="status">{{ t(result.page.locale).draftPreview }}</div>
    </template>
  </EntryTemplate>
  <div v-else style="font-family: system-ui; padding: 2rem">
    <h1>Pré-visualização indisponível</h1>
    <p>
      O link de pré-visualização é inválido ou expirou (<code>{{ result.problem }}</code>). Abra de novo pelo botão Pré-visualizar no CMS.
    </p>
  </div>
</template>
