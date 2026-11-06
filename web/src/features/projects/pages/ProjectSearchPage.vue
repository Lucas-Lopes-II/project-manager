<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import BaseButton from '@/shared/ui/BaseButton.vue'
import MessageCard from '@/shared/ui/MessageCard.vue'

import BackHeading from '../components/BackHeading.vue'
import ProjectCards from '../components/ProjectCards.vue'
import { MIN_SEARCH_LENGTH, searchTerm } from '../search'
import { useSearchHistoryStore } from '../searchHistory'
import { useProjectsStore } from '../store'

const projects = useProjectsStore()
const searchHistory = useSearchHistoryStore()
const route = useRoute()

const term = computed(() => searchTerm(route.query.q))
const isShort = computed(() => term.value.length < MIN_SEARCH_LENGTH)

function load(keepItems = false): void {
  projects.returnTo = { name: 'project-search', query: { q: term.value } }
  if (isShort.value) {
    projects.cancel()
    return
  }
  searchHistory.record(term.value)
  void projects.load({ query: term.value, keepItems })
}

// The bar replaces the address while the person types, so the result follows the term.
watch(term, () => load(true))

onMounted(() => load())
onBeforeUnmount(() => projects.cancel())
</script>

<template>
  <div>
    <BackHeading
      title="Resultado da busca"
      :back="{ name: 'projects', query: projects.listQuery }"
    />

    <!-- The live region stays in the page, so that screen readers announce what appears inside it. -->
    <div role="status">
      <MessageCard
        v-if="!isShort && projects.status === 'loading'"
        class="message"
        delayed
        text="Carregando projetos..."
      />
    </div>

    <MessageCard v-if="isShort" class="message" text="Digite ao menos 3 caracteres para buscar." />

    <MessageCard
      v-else-if="projects.status === 'error'"
      class="message"
      role="alert"
      title="Não foi possível carregar os projetos."
    >
      <BaseButton @click="load()">Tentar novamente</BaseButton>
    </MessageCard>

    <ProjectCards v-else-if="projects.status === 'ready'" class="cards">
      <template #empty>
        <MessageCard
          class="message"
          title="Nenhum projeto encontrado"
          text="Tente buscar por outro nome."
        />
      </template>
    </ProjectCards>
  </div>
</template>

<style scoped>
.cards {
  margin-top: 21px;
}

/* "Voltar", the title and their spaces take 95 px above the card. */
.message {
  --message-card-offset: 95px;

  margin-top: 21px;
}
</style>
