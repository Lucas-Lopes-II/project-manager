import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LocationQuery } from 'vue-router'

import { ApiError } from '@/shared/api/client'

import { deleteProject, listProjects, setFavorite, type Project, type ProjectSort } from './api'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface LoadOptions {
  favoritesOnly?: boolean
  sort?: ProjectSort
  /** Keeps the current list on screen until the answer arrives, so it does not flicker. */
  keepItems?: boolean
}

export const useProjectsStore = defineStore('projects', () => {
  const items = ref<Project[]>([])
  const total = ref(0)
  const status = ref<LoadStatus>('idle')
  const favoritesOnly = ref(false)
  const sort = ref<ProjectSort>('name')

  /** The query of the list, so that the forms return to the same filters. */
  const listQuery = ref<LocationQuery>({})

  let controller: AbortController | undefined
  const pendingFavorites = new Set<string>()

  async function load(options: LoadOptions = {}): Promise<void> {
    controller?.abort()
    const current = new AbortController()
    controller = current
    favoritesOnly.value = options.favoritesOnly ?? false
    sort.value = options.sort ?? 'name'
    if (!(options.keepItems && status.value === 'ready')) {
      status.value = 'loading'
    }

    try {
      const list = await listProjects(current.signal, {
        favoritesOnly: favoritesOnly.value,
        sort: sort.value,
      })
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
    forget(id)
  }

  /**
   * Changes the star right away and undoes only this change if the API fails. With the
   * favorites filter on, a project that stops being a favorite leaves the list.
   */
  async function toggleFavorite(id: string): Promise<void> {
    const index = items.value.findIndex((project) => project.id === id)
    const project = items.value[index]
    if (!project || pendingFavorites.has(id)) {
      return
    }

    const favorite = !project.favorite
    pendingFavorites.add(id)
    if (favoritesOnly.value && !favorite) {
      items.value = items.value.filter((item) => item.id !== id)
    } else {
      replace(id, { favorite })
    }

    try {
      await setFavorite(id, favorite)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        forget(id)
        return
      }
      if (items.value.some((item) => item.id === id)) {
        replace(id, { favorite: project.favorite })
      } else {
        const restored = [...items.value]
        restored.splice(Math.min(index, restored.length), 0, project)
        items.value = restored
      }
      throw error
    } finally {
      pendingFavorites.delete(id)
    }
  }

  function replace(id: string, changes: Partial<Project>): void {
    items.value = items.value.map((item) => (item.id === id ? { ...item, ...changes } : item))
  }

  /** The project no longer exists, so it leaves the list and the total. */
  function forget(id: string): void {
    const remaining = items.value.filter((project) => project.id !== id)
    if (remaining.length < items.value.length || favoritesOnly.value) {
      total.value = Math.max(0, total.value - 1)
    }
    items.value = remaining
  }

  return {
    items,
    total,
    status,
    favoritesOnly,
    sort,
    listQuery,
    load,
    cancel,
    remove,
    toggleFavorite,
  }
})
