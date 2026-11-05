import { defineStore } from 'pinia'
import { ref } from 'vue'

import { ApiError } from '@/shared/api/client'

import { deleteProject, listProjects, type Project } from './api'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useProjectsStore = defineStore('projects', () => {
  const items = ref<Project[]>([])
  const total = ref(0)
  const status = ref<LoadStatus>('idle')

  let controller: AbortController | undefined

  async function load(): Promise<void> {
    controller?.abort()
    const current = new AbortController()
    controller = current
    status.value = 'loading'

    try {
      const list = await listProjects(current.signal)
      if (current !== controller) return

      items.value = list.items
      total.value = list.total
      status.value = 'ready'
    } catch {
      // A canceled or replaced search must not overwrite the state of the current one.
      if (current === controller) {
        status.value = 'error'
      }
    }
  }

  function cancel(): void {
    controller?.abort()
    controller = undefined
    if (status.value === 'loading') {
      status.value = 'idle'
    }
  }

  /** Removes a project after the API confirms it, without searching the list again. */
  async function remove(id: string): Promise<void> {
    try {
      await deleteProject(id)
    } catch (error) {
      // Someone else removed it already, which is the result that was asked for.
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error
      }
    }

    const remaining = items.value.filter((project) => project.id !== id)
    if (remaining.length < items.value.length) {
      items.value = remaining
      total.value -= 1
    }
  }

  return { items, total, status, load, cancel, remove }
})
