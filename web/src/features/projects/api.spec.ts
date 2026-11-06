import { beforeEach, describe, expect, it, vi } from 'vitest'

import { request } from '@/shared/api/client'

import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  setFavorite,
  updateProject,
  type ProjectInput,
} from './api'

vi.mock('@/shared/api/client', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

const input: ProjectInput = {
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  cover: null,
}

function sentForm(): FormData {
  return requestMock.mock.calls[0]?.[1]?.body as FormData
}

beforeEach(() => {
  requestMock.mockReset()
})

describe('createProject', () => {
  it('sends the fields in a form', async () => {
    await createProject(input)

    expect(requestMock.mock.calls[0]?.[0]).toBe('/projects')
    expect(requestMock.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(Object.fromEntries(sentForm())).toEqual({
      name: 'Projeto Iridium',
      client: 'Clicksign',
      start_date: '2026-11-05',
      end_date: '2026-12-12',
    })
  })

  it('sends the cover in the same request', async () => {
    const cover = new File(['image'], 'capa.png', { type: 'image/png' })

    await createProject({ ...input, cover })

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect((sentForm().get('cover') as File).name).toBe('capa.png')
  })
})

describe('getProject', () => {
  it('asks for the project, and escapes what comes from the address', async () => {
    const signal = new AbortController().signal

    await getProject('a/b', signal)

    expect(requestMock).toHaveBeenCalledWith('/projects/a%2Fb', { signal })
  })
})

describe('updateProject', () => {
  const cover = new File(['image'], 'capa.png', { type: 'image/png' })

  it('sends the fields and keeps the cover without mentioning it', async () => {
    await updateProject('1', input)

    expect(requestMock.mock.calls[0]?.[0]).toBe('/projects/1')
    expect(requestMock.mock.calls[0]?.[1]?.method).toBe('PUT')
    expect(Object.fromEntries(sentForm())).toEqual({
      name: 'Projeto Iridium',
      client: 'Clicksign',
      start_date: '2026-11-05',
      end_date: '2026-12-12',
    })
  })

  it('sends a new cover', async () => {
    await updateProject('1', { ...input, cover })

    expect((sentForm().get('cover') as File).name).toBe('capa.png')
    expect(sentForm().has('remove_cover')).toBe(false)
  })

  it('asks to remove the cover', async () => {
    await updateProject('1', { ...input, removeCover: true })

    expect(sentForm().get('remove_cover')).toBe('true')
    expect(sentForm().has('cover')).toBe(false)
  })

  it('does not ask to remove the cover when there is a new one', async () => {
    await updateProject('1', { ...input, cover, removeCover: true })

    expect(sentForm().has('cover')).toBe(true)
    expect(sentForm().has('remove_cover')).toBe(false)
  })
})

describe('deleteProject', () => {
  it('asks the API to remove the project', async () => {
    await deleteProject('a/b')

    expect(requestMock).toHaveBeenCalledWith('/projects/a%2Fb', { method: 'DELETE' })
  })
})

describe('listProjects', () => {
  it('asks for every project by default', async () => {
    const signal = new AbortController().signal

    await listProjects(signal)

    expect(requestMock).toHaveBeenCalledWith('/projects', { signal })
  })

  it('asks the API for the favorites only', async () => {
    await listProjects(undefined, { favoritesOnly: true })

    expect(requestMock).toHaveBeenCalledWith('/projects?favorite=true', { signal: undefined })
  })

  it('asks for the projects whose name contains a term', async () => {
    await listProjects(undefined, { query: 'área 51' })
    await listProjects(undefined, { query: '' })

    expect(requestMock.mock.calls.map(([path]) => path)).toEqual([
      '/projects?q=%C3%A1rea+51',
      '/projects',
    ])
  })

  it('asks for an order, leaving the default one out', async () => {
    await listProjects(undefined, { sort: 'name' })
    await listProjects(undefined, { sort: 'deadline' })
    await listProjects(undefined, { favoritesOnly: true, sort: 'recent' })

    expect(requestMock.mock.calls.map(([path]) => path)).toEqual([
      '/projects',
      '/projects?sort=deadline',
      '/projects?favorite=true&sort=recent',
    ])
  })
})

describe('setFavorite', () => {
  it('marks with PUT and unmarks with DELETE', async () => {
    await setFavorite('a/b', true)
    await setFavorite('a/b', false)

    expect(requestMock).toHaveBeenNthCalledWith(1, '/projects/a%2Fb/favorite', { method: 'PUT' })
    expect(requestMock).toHaveBeenNthCalledWith(2, '/projects/a%2Fb/favorite', { method: 'DELETE' })
  })
})
