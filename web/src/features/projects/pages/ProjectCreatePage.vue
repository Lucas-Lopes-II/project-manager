<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/shared/api/client'

import { createProject, type ProjectInput } from '../api'
import ProjectForm from '../components/ProjectForm.vue'
import { errorsFromApi, hasErrors, type ProjectErrors } from '../validation'

const SAVE_FAILURE = 'Não foi possível salvar o projeto. Tente novamente.'

const router = useRouter()

const saving = ref(false)
const serverErrors = ref<ProjectErrors>({})
const failure = ref<string>()

async function save(values: ProjectInput): Promise<void> {
  saving.value = true
  failure.value = undefined

  try {
    await createProject(values)
  } catch (error) {
    saving.value = false
    serverErrors.value = error instanceof ApiError ? errorsFromApi(error) : {}
    if (!hasErrors(serverErrors.value)) {
      failure.value = SAVE_FAILURE
    }
    return
  }

  // Outside the try and still saving: the project exists, so nothing here can offer another attempt.
  await router.push({ name: 'projects' })
}

function clearErrors(): void {
  serverErrors.value = {}
  failure.value = undefined
}
</script>

<template>
  <RouterLink class="back" :to="{ name: 'projects' }">
    <img src="@/shared/assets/icons/arrow-left.svg" alt="" width="16" height="16" />
    Voltar
  </RouterLink>
  <h1 class="title">Novo projeto</h1>

  <section class="card">
    <ProjectForm
      :saving="saving"
      :server-errors="serverErrors"
      :failure="failure"
      @submit="save"
      @change="clearErrors"
    />
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
