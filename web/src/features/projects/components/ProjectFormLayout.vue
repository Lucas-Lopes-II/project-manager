<script setup lang="ts">
import { useProjectsStore } from '../store'
import BackHeading from './BackHeading.vue'

defineProps<{ title: string }>()

const projects = useProjectsStore()
</script>

<template>
  <BackHeading :title="title" :back="projects.returnTo" />

  <section class="card">
    <slot />
  </section>
</template>

<style scoped>
.card {
  margin-top: 33px;
  padding: 51px 24px;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-control);
}
</style>
