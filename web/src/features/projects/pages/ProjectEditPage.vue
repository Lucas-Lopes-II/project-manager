<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { ApiError } from '@/shared/api/client'
import BaseButton from '@/shared/ui/BaseButton.vue'
import MessageCard from '@/shared/ui/MessageCard.vue'

import { getProject, updateProject, type Project } from '../api'
import ProjectForm from '../components/ProjectForm.vue'
import ProjectFormLayout from '../components/ProjectFormLayout.vue'
import { useSaveProject } from '../useSaveProject'

const props = defineProps<{ id: string }>()

type LoadStatus = 'loading' | 'ready' | 'not-found' | 'error'

const project = ref<Project>()
const status = ref<LoadStatus>('loading')

const { saving, serverErrors, failure, notFound, submit, clearErrors } = useSaveProject((values) =>
  updateProject(props.id, values),
)

// The project can also disappear between opening the form and saving it.
const isMissing = computed(() => status.value === 'not-found' || notFound.value)

let controller: AbortController | undefined

async function load(): Promise<void> {
  controller?.abort()
  const current = new AbortController()
  controller = current
  status.value = 'loading'

  try {
    const loaded = await getProject(props.id, current.signal)
    if (current === controller) {
      project.value = loaded
      status.value = 'ready'
    }
  } catch (error) {
    if (current === controller) {
      status.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error'
    }
  }
}

onMounted(load)

onBeforeUnmount(() => {
  controller?.abort()
  controller = undefined
})
</script>

<template>
  <!-- The live region stays in the page, so that screen readers announce what appears inside it. -->
  <div role="status">
    <MessageCard v-if="status === 'loading'" delayed text="Carregando projeto..." />
  </div>

  <MessageCard
    v-if="isMissing"
    title="Projeto não encontrado"
    text="Ele pode ter sido removido. Volte para a lista para ver os projetos cadastrados."
  >
    <BaseButton :to="{ name: 'projects' }">Voltar para a lista</BaseButton>
  </MessageCard>

  <MessageCard
    v-else-if="status === 'error'"
    role="alert"
    title="Não foi possível carregar o projeto."
  >
    <BaseButton @click="load">Tentar novamente</BaseButton>
  </MessageCard>

  <ProjectFormLayout v-else-if="status === 'ready' && project" title="Editar projeto">
    <ProjectForm
      :project="project"
      :saving="saving"
      :server-errors="serverErrors"
      :failure="failure"
      @submit="submit"
      @change="clearErrors"
    />
  </ProjectFormLayout>
</template>
