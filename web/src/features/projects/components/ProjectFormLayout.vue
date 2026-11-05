<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <RouterLink class="back" :to="{ name: 'projects' }">
    <img src="@/shared/assets/icons/arrow-left.svg" alt="" width="16" height="16" />
    Voltar
  </RouterLink>
  <h1 class="title">{{ title }}</h1>

  <section class="card">
    <slot />
  </section>
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
  margin: 8px 0 33px 5px;
  color: var(--color-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: 32px;
}

.card {
  padding: 51px 24px;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-control);
}
</style>
