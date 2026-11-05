<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  /** Renders a link to this route instead of a button. */
  to?: RouteLocationRaw
}>()
</script>

<template>
  <RouterLink v-if="to" class="button" :to="to"><slot /></RouterLink>
  <button v-else class="button" type="button"><slot /></button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-width: 230px;
  height: 52px;
  padding-inline: 32px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: var(--color-surface);
  font-size: var(--font-size-xl);
  line-height: 22px;
  text-decoration: none;
}
</style>
