<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import BaseButton from '@/shared/ui/BaseButton.vue'
import MessageCard from '@/shared/ui/MessageCard.vue'

import ProjectCard from '../components/ProjectCard.vue'
import { useProjectsStore } from '../store'

const projects = useProjectsStore()

onMounted(() => projects.load())
onBeforeUnmount(() => projects.cancel())
</script>

<template>
  <!-- The live region stays in the page, so that screen readers announce what appears inside it. -->
  <div role="status">
    <MessageCard
      v-if="projects.status === 'loading'"
      class="delayed"
      text="Carregando projetos..."
    />
  </div>

  <MessageCard
    v-if="projects.status === 'error'"
    role="alert"
    title="Não foi possível carregar os projetos."
  >
    <BaseButton @click="projects.load()">Tentar novamente</BaseButton>
  </MessageCard>

  <template v-else-if="projects.status === 'ready'">
    <template v-if="projects.total > 0">
      <div class="toolbar">
        <h1 class="title">
          Projetos <span class="count">({{ projects.total }})</span>
        </h1>
        <BaseButton class="new-project" size="small" :to="{ name: 'project-new' }">
          <img src="@/shared/assets/icons/plus-circle.svg" alt="" width="24" height="24" />
          Novo projeto
        </BaseButton>
      </div>

      <ul class="grid">
        <li v-for="project in projects.items" :key="project.id" class="item">
          <ProjectCard :project="project" />
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
</template>

<style scoped>
/* Quick answers replace the card before it shows, so the text does not flicker. */
.delayed {
  animation: reveal 0s 300ms both;
}

@keyframes reveal {
  from {
    visibility: hidden;
  }

  to {
    visibility: visible;
  }
}

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
