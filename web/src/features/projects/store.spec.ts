import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api/client'

import { listProjects, type Project, type ProjectList } from './api'
import { useProjectsStore } from './store'

vi.mock('./api', () => ({ listProjects: vi.fn() }))

const listProjectsMock = vi.mocked(listProjects)

const project: Project = {
  id: '61705246-aacf-4373-875a-08f4dd31428c',
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-04',
  end_date: '2026-12-12',
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
