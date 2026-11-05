import { defineStore } from 'pinia'
import { ref } from 'vue'

import { listProjects, type Project } from './api'

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

  return { items, total, status, load, cancel }
})
