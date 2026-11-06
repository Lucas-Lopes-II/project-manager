<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from './AppHeader.vue'

const route = useRoute()
const main = useTemplateRef('main')

/**
 * A new page takes the focus to its title, so that screen readers announce it, or to the content
 * while the title loads. The first page starts at the top, as usual, and typing in the search
 * opens the result without taking the focus from the field (ADR-0037).
 */
watch(
  () => route.name,
  async (_, previous) => {
    if (previous === undefined || document.activeElement?.closest('[role="search"]')) return
    await nextTick()
    const heading = main.value?.querySelector<HTMLElement>('h1')
    ;(heading ?? main.value)?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <AppHeader />
  <main ref="main" class="content" tabindex="-1">
    <RouterView />
  </main>
</template>

<style scoped>
.content {
  padding: var(--space-page-top) var(--space-page-inline);
}
</style>
