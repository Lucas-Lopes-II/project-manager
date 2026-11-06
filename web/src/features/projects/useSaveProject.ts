import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/shared/api/client'

import type { ProjectInput } from './api'
import { useProjectsStore } from './store'
import { errorsFromApi, hasErrors, type ProjectErrors } from './validation'

const SAVE_FAILURE = 'Não foi possível salvar o projeto. Tente novamente.'
const PROJECT_LIMIT = 'Limite de 200 projetos atingido. Remova um projeto para criar outro.'

/** Saves the form and returns to the list, or keeps the form open with what went wrong. */
export function useSaveProject(save: (values: ProjectInput) => Promise<unknown>) {
  const router = useRouter()
  const projects = useProjectsStore()

  const saving = ref(false)
  const serverErrors = ref<ProjectErrors>({})
  const failure = ref<string>()
  const notFound = ref(false)

  async function submit(values: ProjectInput): Promise<void> {
    saving.value = true
    failure.value = undefined

    try {
      await save(values)
    } catch (error) {
      saving.value = false
      serverErrors.value = error instanceof ApiError ? errorsFromApi(error) : {}
      notFound.value = error instanceof ApiError && error.status === 404
      if (!hasErrors(serverErrors.value)) {
        failure.value =
          error instanceof ApiError && error.code === 'project_limit' ? PROJECT_LIMIT : SAVE_FAILURE
      }
      return
    }

    // Outside the try and still saving: the project was saved, so nothing here can offer another attempt.
    await router.push(projects.returnTo)
  }

  function clearErrors(): void {
    serverErrors.value = {}
    failure.value = undefined
  }

  return { saving, serverErrors, failure, notFound, submit, clearErrors }
}
