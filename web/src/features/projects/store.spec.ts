import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api/client'

import { deleteProject, listProjects, type Project, type ProjectList } from './api'
import { useProjectsStore } from './store'

vi.mock('./api', () => ({ deleteProject: vi.fn(), listProjects: vi.fn() }))

const listProjectsMock = vi.mocked(listProjects)
const deleteProjectMock = vi.mocked(deleteProject)

const project: Project = {
  id: '61705246-aacf-4373-875a-08f4dd31428c',
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-04',
  end_date: '2026-12-12',
  cover_url: null,
  created_at: '2026-11-04T18:21:55Z',
  updated_at: '2026-11-04T18:21:55Z',
}

function deferredList() {
  let resolve!: (list: ProjectList) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<ProjectList>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  setActivePinia(createPinia())
  listProjectsMock.mockReset()
})

describe('useProjectsStore', () => {
  it('starts without projects and without a search', () => {
    const store = useProjectsStore()

    expect(store.status).toBe('idle')
    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
  })

  it('is loading until the API answers', async () => {
    const answer = deferredList()
    listProjectsMock.mockReturnValue(answer.promise)
    const store = useProjectsStore()

    const loading = store.load()
    expect(store.status).toBe('loading')

    answer.resolve({ items: [project], total: 1 })
    await loading

    expect(store.status).toBe('ready')
    expect(store.items).toEqual([project])
    expect(store.total).toBe(1)
  })

  it('reports a failure of the API', async () => {
    listProjectsMock.mockRejectedValue(new ApiError(500, 'Erro interno'))
    const store = useProjectsStore()

    await store.load()

    expect(store.status).toBe('error')
  })

  it('recovers when a new search succeeds after a failure', async () => {
    listProjectsMock.mockRejectedValueOnce(new ApiError(0, 'Sem conexão'))
    listProjectsMock.mockResolvedValueOnce({ items: [project], total: 1 })
    const store = useProjectsStore()

    await store.load()
    await store.load()

    expect(store.status).toBe('ready')
    expect(store.total).toBe(1)
  })

  it('cancels the previous search and ignores its answer', async () => {
    const first = deferredList()
    const second = deferredList()
    listProjectsMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const store = useProjectsStore()

    const firstLoad = store.load()
    const secondLoad = store.load()

    const firstSignal = listProjectsMock.mock.calls[0]?.[0]
    expect(firstSignal?.aborted).toBe(true)

    second.resolve({ items: [project], total: 1 })
    await secondLoad
    first.resolve({ items: [], total: 0 })
    await firstLoad

    expect(store.status).toBe('ready')
    expect(store.total).toBe(1)
  })

  it('does not report an error when a replaced search fails', async () => {
    const first = deferredList()
    const second = deferredList()
    listProjectsMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const store = useProjectsStore()

    const firstLoad = store.load()
    const secondLoad = store.load()

    first.reject(new DOMException('Aborted', 'AbortError'))
    await firstLoad

    expect(store.status).toBe('loading')

    second.resolve({ items: [], total: 0 })
    await secondLoad

    expect(store.status).toBe('ready')
  })

  it('goes back to idle when the search is canceled', async () => {
    const answer = deferredList()
    listProjectsMock.mockReturnValue(answer.promise)
    const store = useProjectsStore()

    const loading = store.load()
    store.cancel()

    expect(listProjectsMock.mock.calls[0]?.[0]?.aborted).toBe(true)
    expect(store.status).toBe('idle')

    answer.reject(new DOMException('Aborted', 'AbortError'))
    await loading

    expect(store.status).toBe('idle')
  })

  it('keeps the loaded projects when canceling after the answer', async () => {
    listProjectsMock.mockResolvedValue({ items: [project], total: 1 })
    const store = useProjectsStore()

    await store.load()
    store.cancel()

    expect(store.status).toBe('ready')
    expect(store.total).toBe(1)
  })
})

describe('remove', () => {
  const other: Project = { ...project, id: 'outro', name: 'Projeto Alfa' }

  async function loadedStore() {
    listProjectsMock.mockResolvedValue({ items: [project, other], total: 2 })
    const store = useProjectsStore()
    await store.load()
    return store
  }

  beforeEach(() => {
    deleteProjectMock.mockReset()
  })

  it('removes the project from the list after the API confirms it', async () => {
    deleteProjectMock.mockResolvedValue(undefined)
    const store = await loadedStore()

    await store.remove(project.id)

    expect(deleteProjectMock).toHaveBeenCalledWith(project.id)
    expect(store.items).toEqual([other])
    expect(store.total).toBe(1)
    expect(listProjectsMock).toHaveBeenCalledTimes(1)
  })

  it('keeps the list and reports the failure', async () => {
    deleteProjectMock.mockRejectedValue(new ApiError(500, 'Erro interno'))
    const store = await loadedStore()

    await expect(store.remove(project.id)).rejects.toThrow('Erro interno')

    expect(store.items).toEqual([project, other])
    expect(store.total).toBe(2)
  })

  it('removes a project that someone else removed first', async () => {
    deleteProjectMock.mockRejectedValue(new ApiError(404, 'Projeto não encontrado.'))
    const store = await loadedStore()

    await store.remove(project.id)

    expect(store.items).toEqual([other])
    expect(store.total).toBe(1)
  })

  it('does not change the total for a project that is not in the list', async () => {
    deleteProjectMock.mockResolvedValue(undefined)
    const store = await loadedStore()

    await store.remove('desconhecido')

    expect(store.total).toBe(2)
  })
})
