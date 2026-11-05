<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  icon: string
}>()
</script>

<template>
  <RouterLink class="item" role="menuitem" tabindex="-1" :to="to">
    <img :src="icon" alt="" width="24" height="24" />
    <slot />
  </RouterLink>
</template>

<style scoped>
.item {
  display: flex;
  position: relative;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding-inline: 20px;
  border-radius: var(--radius-control);
  color: var(--color-primary);
  line-height: 16px;
  text-decoration: none;

  &:hover {
    background: var(--color-page);
  }

  &:focus-visible {
    outline-offset: -2px;
  }
}
</style>
