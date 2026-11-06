<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import BaseToggle from '@/shared/ui/BaseToggle.vue'
import MessageCard from '@/shared/ui/MessageCard.vue'

import type { ProjectSort } from '../api'
import ProjectCards from '../components/ProjectCards.vue'
import { useProjectsStore } from '../store'

const SORT_OPTIONS: { value: ProjectSort; label: string }[] = [
  { value: 'name', label: 'Ordem alfabética' },
  { value: 'recent', label: 'Iniciados mais recentes' },
  { value: 'deadline', label: 'Prazo mais próximo' },
]

/** How each order appears in the address. The default one is left out. */
const SORT_IN_ADDRESS: Record<ProjectSort, string | undefined> = {
  name: undefined,
  recent: 'recentes',
  deadline: 'prazo',
}

const projects = useProjectsStore()
const route = useRoute()
const router = useRouter()

/** The filter lives in the address, so it survives a reload. Changing it replaces the entry. */
const favoritesOnly = computed({
  get: () => route.query.favoritos === 'true',
  set: (value: boolean) => {
    void router.replace({ query: { ...route.query, favoritos: value ? 'true' : undefined } })
  },
})

const sort = computed({
  get: (): ProjectSort =>
    SORT_OPTIONS.find(({ value }) => SORT_IN_ADDRESS[value] === route.query.ordem)?.value ?? 'name',
  set: (value: ProjectSort) => {
    void router.replace({ query: { ...route.query, ordem: SORT_IN_ADDRESS[value] } })
  },
})

function load(keepItems = false): Promise<void> {
  projects.listQuery = { ...route.query }
  projects.returnTo = { name: 'projects', query: { ...route.query } }
  return projects.load({ favoritesOnly: favoritesOnly.value, sort: sort.value, keepItems })
}

watch([favoritesOnly, sort], () => load(true))

onMounted(() => load())
onBeforeUnmount(() => projects.cancel())
</script>

<template>
  <div>
    <!-- The live region stays in the page, so that screen readers announce what appears inside it. -->
    <div role="status">
      <MessageCard v-if="projects.status === 'loading'" delayed text="Carregando projetos..." />
    </div>

    <MessageCard
      v-if="projects.status === 'error'"
      role="alert"
      title="Não foi possível carregar os projetos."
    >
      <BaseButton @click="load()">Tentar novamente</BaseButton>
    </MessageCard>

    <!-- The cards stay mounted when the last project is removed, so the dialog can finish. -->
    <template v-else-if="projects.status === 'ready'">
      <div v-if="projects.total > 0" class="toolbar">
        <h1 class="title" tabindex="-1">
          Projetos <span class="count">({{ projects.total }})</span>
        </h1>
        <div class="controls">
          <BaseToggle v-model="favoritesOnly">Apenas Favoritos</BaseToggle>
          <BaseSelect v-model="sort" :options="SORT_OPTIONS" label="Ordenar projetos" />
          <BaseButton class="new-project" size="small" :to="{ name: 'project-new' }">
            <img src="@/shared/assets/icons/plus-circle.svg" alt="" width="24" height="24" />
            Novo projeto
          </BaseButton>
        </div>
      </div>

      <ProjectCards :class="{ cards: projects.total > 0 }">
        <template #empty>
          <MessageCard
            v-if="projects.total === 0"
            title="Nenhum projeto"
            text="Clique no botão abaixo para criar o primeiro e gerenciá-lo."
          >
            <BaseButton :to="{ name: 'project-new' }">
              <img src="@/shared/assets/icons/plus-circle.svg" alt="" width="24" height="24" />
              Novo projeto
            </BaseButton>
          </MessageCard>
          <MessageCard
            v-else-if="favoritesOnly"
            class="no-favorites"
            title="Nenhum projeto favorito"
            text="Clique na estrela de um projeto para encontrá-lo aqui."
          />
        </template>
      </ProjectCards>
    </template>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-inline: var(--space-page-inset);
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 32px;
}

.cards {
  margin-top: 22px;
}

/* The toolbar and its space take 62 px above the card. */
.no-favorites {
  --message-card-offset: 62px;
}

.new-project {
  justify-content: flex-start;
  min-width: 184px;
}

.count {
  color: var(--color-primary);
  font-size: var(--font-size-count);
  font-weight: var(--font-weight-regular);
}
</style>
