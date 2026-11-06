<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'

import type { Project } from '../api'
import { useProjectsStore } from '../store'
import ProjectCard from './ProjectCard.vue'
import RemoveProjectDialog from './RemoveProjectDialog.vue'

const FAVORITE_FAILURE = 'Não foi possível atualizar o favorito. Tente novamente.'

/** The cards of the store, with the star and the menu, shared by the list and the search result. */
const projects = useProjectsStore()

const root = useTemplateRef('root')
const toRemove = ref<Project | null>(null)
const favoriteFailure = ref<string>()

// A failure belongs to the list it happened in.
watch(
  () => [projects.favoritesOnly, projects.sort, projects.query],
  () => (favoriteFailure.value = undefined),
)

/**
 * The focus targets are in the page around the cards, such as its title. The page is read
 * before the update, because the cards leave the page when the last one is removed.
 */
async function focusAfterUpdate(selector: string): Promise<void> {
  const page = root.value?.parentElement
  await nextTick()
  page?.querySelector<HTMLElement>(selector)?.focus()
}

async function onToggleFavorite(project: Project): Promise<void> {
  favoriteFailure.value = undefined
  // With the favorites filter on, unmarking takes the card and its star out of the list.
  const leavesTheList = projects.favoritesOnly && project.favorite
  const toggling = projects.toggleFavorite(project.id)
  if (leavesTheList) {
    await focusAfterUpdate('h1')
  }

  try {
    await toggling
  } catch {
    favoriteFailure.value = FAVORITE_FAILURE
  }
}

// The page moves the focus itself: with a real click, the dialog opens before the menu returns
// the focus to its button, so the browser would return it to an option that no longer exists.
function closeDialog(target: (id: string) => string): Promise<void> {
  const id = toRemove.value?.id
  toRemove.value = null
  return id ? focusAfterUpdate(target(id)) : Promise.resolve()
}

function onCancel(): Promise<void> {
  return closeDialog((id) => `[data-project-id="${id}"] button[aria-haspopup="menu"]`)
}

/** The removed card took its button with it, so the focus goes to the title of the page. */
function onRemoved(): Promise<void> {
  return closeDialog(() => 'h1')
}
</script>

<template>
  <div ref="root">
    <p v-if="favoriteFailure" class="favorite-failure" role="alert">{{ favoriteFailure }}</p>

    <slot v-if="projects.items.length === 0" name="empty" />

    <ul v-else class="grid">
      <li v-for="project in projects.items" :key="project.id" class="item">
        <!-- The list loads without a term, so only the search result marks the names. -->
        <ProjectCard
          :project="project"
          :highlight="projects.query"
          @remove="toRemove = $event"
          @toggle-favorite="onToggleFavorite"
        />
      </li>
    </ul>

    <RemoveProjectDialog :project="toRemove" @cancel="onCancel" @removed="onRemoved" />
  </div>
</template>

<style scoped>
.favorite-failure {
  margin: 0 var(--space-page-inset) 16px;
  color: var(--color-error);
  line-height: 22px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(346px, 100%), 1fr));
  gap: var(--space-grid);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Two columns on tablets, instead of a single card as wide as the screen (ADR-0036). */
@media (width < 1024px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  }
}

.item {
  display: grid;
}
</style>
