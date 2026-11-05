<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import BaseToggle from '@/shared/ui/BaseToggle.vue'
import MessageCard from '@/shared/ui/MessageCard.vue'

import type { Project, ProjectSort } from '../api'
import ProjectCard from '../components/ProjectCard.vue'
import RemoveProjectDialog from '../components/RemoveProjectDialog.vue'
import { useProjectsStore } from '../store'

const FAVORITE_FAILURE = 'Não foi possível atualizar o favorito. Tente novamente.'

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

const page = useTemplateRef('page')
const toRemove = ref<Project | null>(null)
const favoriteFailure = ref<string>()

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
  return projects.load({ favoritesOnly: favoritesOnly.value, sort: sort.value, keepItems })
}

watch([favoritesOnly, sort], () => {
  favoriteFailure.value = undefined
  void load(true)
})

function focusTitle(): void {
  page.value?.querySelector<HTMLElement>('h1')?.focus()
}

async function onToggleFavorite(project: Project): Promise<void> {
  favoriteFailure.value = undefined
  // With the filter on, unmarking takes the card and its star out of the list.
  const leavesTheList = favoritesOnly.value && project.favorite
  const toggling = projects.toggleFavorite(project.id)
  if (leavesTheList) {
    await nextTick()
    focusTitle()
  }

  try {
    await toggling
  } catch {
    favoriteFailure.value = FAVORITE_FAILURE
  }
}

// The page moves the focus itself: with a real click, the dialog opens before the menu returns
// the focus to its button, so the browser would return it to an option that no longer exists.
async function closeDialog(focusTarget: (id: string) => string): Promise<void> {
  const id = toRemove.value?.id
  toRemove.value = null
  await nextTick()
  if (id) {
    page.value?.querySelector<HTMLElement>(focusTarget(id))?.focus()
  }
}

function onCancel(): Promise<void> {
  return closeDialog((id) => `[data-project-id="${id}"] button[aria-haspopup="menu"]`)
}

/** The removed card took its button with it, so the focus goes to the title of the list. */
function onRemoved(): Promise<void> {
  return closeDialog(() => 'h1')
}

onMounted(() => load())
onBeforeUnmount(() => projects.cancel())
</script>

<template>
  <div ref="page">
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

    <template v-else-if="projects.status === 'ready'">
      <template v-if="projects.total > 0">
        <div class="toolbar">
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

        <p v-if="favoriteFailure" class="favorite-failure" role="alert">{{ favoriteFailure }}</p>

        <MessageCard
          v-if="favoritesOnly && projects.items.length === 0"
          class="no-favorites"
          title="Nenhum projeto favorito"
          text="Clique na estrela de um projeto para encontrá-lo aqui."
        />

        <ul v-else class="grid">
          <li v-for="project in projects.items" :key="project.id" class="item">
            <ProjectCard
              :project="project"
              @remove="toRemove = $event"
              @toggle-favorite="onToggleFavorite"
            />
          </li>
        </ul>
      </template>

      <MessageCard
        v-else
        title="Nenhum projeto"
        text="Clique no botão abaixo para criar o primeiro e gerenciá-lo."
      >
        <BaseButton :to="{ name: 'project-new' }">
          <img src="@/shared/assets/icons/plus-circle.svg" alt="" width="24" height="24" />
          Novo projeto
        </BaseButton>
      </MessageCard>
    </template>

    <RemoveProjectDialog :project="toRemove" @cancel="onCancel" @removed="onRemoved" />
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

.favorite-failure {
  margin: 16px var(--space-page-inset) 0;
  color: var(--color-error);
  line-height: 22px;
}

/* The toolbar and its space take 62 px above the card. */
.no-favorites {
  --message-card-offset: 62px;

  margin-top: 22px;
}

.new-project {
  justify-content: flex-start;
  min-width: 184px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(346px, 100%), 1fr));
  gap: var(--space-grid);
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
}

.item {
  display: grid;
}

.count {
  color: var(--color-primary);
  font-size: var(--font-size-count);
  font-weight: var(--font-weight-regular);
}
</style>
