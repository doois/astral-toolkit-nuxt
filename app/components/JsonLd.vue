<script lang="ts">
// A <script type="application/ld+json"> inside the body (Vue templates cannot hold
// script tags). The data is serialized with "<" escaped, so it cannot close the tag.
import { defineComponent, h, type PropType } from "vue";

export default defineComponent({
  props: { data: { type: Object as PropType<Record<string, unknown>>, required: true } },
  setup: (props) => () => h("script", { type: "application/ld+json", innerHTML: JSON.stringify(props.data).replace(/</g, "\\u003c") }),
});
</script>
