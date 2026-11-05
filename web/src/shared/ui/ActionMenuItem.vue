<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  /** Renders a link to this route instead of a button. */
  to?: RouteLocationRaw
  icon: string
}>()
</script>

<template>
  <RouterLink v-if="to" class="item" role="menuitem" tabindex="-1" :to="to">
    <img :src="icon" alt="" width="24" height="24" />
    <slot />
  </RouterLink>
  <button v-else class="item" type="button" role="menuitem" tabindex="-1">
    <img :src="icon" alt="" width="24" height="24" />
    <slot />
  </button>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 52px;
  padding-inline: 20px;
  border: 0;
  background: none;
  color: var(--color-primary);
  line-height: 16px;
  text-decoration: none;

  &:first-child {
    border-radius: var(--radius-control) var(--radius-control) 0 0;
  }

  &:last-child {
    border-radius: 0 0 var(--radius-control) var(--radius-control);
  }

  &:only-child {
    border-radius: var(--radius-control);
  }

  /* With the divider, the next options are 1 px taller, as in the design. */
  & + & {
    height: 54px;
    border-top: 1px solid var(--color-page);
  }

  &:hover {
    background: var(--color-page);
  }

  &:focus-visible {
    outline-offset: -2px;
  }
}
</style>
