<script setup lang="ts">
import AppHeader from './AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="content">
    <RouterView />
  </main>
</template>

<style scoped>
.content {
  padding: var(--space-page-top) var(--space-page-inline);
}
</style>
