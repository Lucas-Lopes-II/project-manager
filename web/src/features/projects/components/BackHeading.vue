<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  back: RouteLocationRaw
}>()
</script>

<template>
  <RouterLink class="back" :to="back">
    <img src="@/shared/assets/icons/arrow-left.svg" alt="" width="16" height="16" />
    Voltar
  </RouterLink>
  <h1 class="title" tabindex="-1">{{ title }}</h1>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 27px;
  margin: 7px 0 0 5px;
  color: var(--color-primary);
  text-decoration: none;
}

.title {
  margin: 8px 0 0 5px;
  color: var(--color-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: 32px;
}
</style>
