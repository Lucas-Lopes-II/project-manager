<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <header class="header">
    <RouterLink class="logo" :to="{ name: 'projects' }">
      <img src="@/shared/assets/logo.svg" alt="Gerenciador de Projetos" width="193" height="72" />
    </RouterLink>
    <button v-if="!route.meta.hideSearch" class="search" type="button" aria-label="Buscar projetos">
      <img src="@/shared/assets/icons/search.svg" alt="" width="20" height="20" />
    </button>
  </header>
</template>

<style scoped>
.header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: var(--topbar-height);
  background: var(--color-topbar);
  box-shadow: var(--shadow-raised);

  :focus-visible {
    outline-color: var(--color-surface);
  }
}

.logo {
  grid-column: 2;
}

.search {
  display: grid;
  place-items: center;
  justify-self: end;
  width: 40px;
  height: 40px;
  margin-right: 53px;
  padding: 0;
  border: 0;
  background: none;
}
</style>
