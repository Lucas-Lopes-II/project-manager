<script setup lang="ts">
defineProps<{
  title?: string
  text?: string
}>()
</script>

<template>
  <div class="card">
    <h1 v-if="title" class="title">{{ title }}</h1>
    <p v-if="text" class="text">{{ text }}</p>
    <slot />
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100dvh - var(--topbar-height) - 2 * var(--space-page-top));
  margin-inline: var(--space-page-inset);
  /* One more pixel below keeps the odd content height on whole pixels at the design size. */
  padding: var(--space-grid) var(--space-grid) calc(var(--space-grid) + 1px);
  border-radius: var(--radius-field);
  background: var(--color-surface);
  text-align: center;
}

.title {
  margin-bottom: 24px;
  color: var(--color-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
}

.text {
  margin-bottom: 34px;
  color: var(--color-text-muted);
  line-height: 22px;
}

.title:last-child,
.text:last-child {
  margin-bottom: 0;
}
</style>
