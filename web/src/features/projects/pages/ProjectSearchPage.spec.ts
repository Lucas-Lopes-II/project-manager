import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import router from '@/app/router'
import { ApiError } from '@/shared/api/client'

import { listProjects, type Project } from '../api'
import { useProjectsStore } from '../store'
import ProjectSearchPage from './ProjectSearchPage.vue'

vi.mock('../api', () => ({ listProjects: vi.fn(), deleteProject: vi.fn(), setFavorite: vi.fn() }))

const listProjectsMock = vi.mocked(listProjects)

enableAutoUnmount(afterEach)

const project: Project = {
  id: '1',
  name: 'Projeto Alfa',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  favorite: false,
  cover_url: null,
  created_at: '2026-11-05T12:00:00Z',
  updated_at: '2026-11-05T12:00:00Z',
}

async function mountPage(path: string) {
  await router.replace(path)
  const pinia = createPinia()
  const wrapper = mount(ProjectSearchPage, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  listProjectsMock.mockReset()
  document.body.innerHTML = ''
})

describe('ProjectSearchPage', () => {
  it('searches for the term of the address and shows the cards', async () => {
    listProjectsMock.mockResolvedValue({ items: [project], total: 3 })

    const wrapper = await mountPage('/busca?q=%20proj%20')

    expect(listProjectsMock.mock.calls[0]?.[1]).toEqual({
      favoritesOnly: false,
      sort: 'name',
      query: 'proj',
    })
    expect(wrapper.get('h1').text()).toBe('Resultado da busca')
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('(3)')
  })

  it('goes back to the list with the filters it had', async () => {
    listProjectsMock.mockResolvedValue({ items: [project], total: 1 })

    const wrapper = await mountPage('/busca?q=proj')
    useProjectsStore().listQuery = { favoritos: 'true' }
    await flushPromises()

    expect(wrapper.get('a').text()).toBe('Voltar')
    expect(wrapper.get('a').attributes('href')).toBe('/?favoritos=true')
  })

  it('makes the forms return to the result', async () => {
    listProjectsMock.mockResolvedValue({ items: [project], total: 1 })

    await mountPage('/busca?q=proj')

    expect(useProjectsStore().returnTo).toEqual({ name: 'project-search', query: { q: 'proj' } })
  })

  it('asks for at least 3 characters without searching', async () => {
    const wrapper = await mountPage('/busca?q=pr')

    expect(listProjectsMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Digite ao menos 3 caracteres para buscar.')
  })

  it('explains when nothing is found', async () => {
    listProjectsMock.mockResolvedValue({ items: [], total: 3 })

    const wrapper = await mountPage('/busca?q=nada')

    expect(wrapper.text()).toContain('Nenhum projeto encontrado')
    expect(wrapper.text()).toContain('Tente buscar por outro nome.')
  })

  it('follows a new term, keeping the current result while it loads', async () => {
    listProjectsMock.mockResolvedValueOnce({ items: [project], total: 1 })
    const wrapper = await mountPage('/busca?q=proj')

    listProjectsMock.mockReturnValueOnce(new Promise(() => {}))
    await router.replace('/busca?q=projeto')
    await flushPromises()

    expect(listProjectsMock.mock.calls[1]?.[1]).toMatchObject({ query: 'projeto' })
    expect(wrapper.findAll('article')).toHaveLength(1)
  })

  it('reports a failure and tries again', async () => {
    listProjectsMock.mockRejectedValueOnce(new ApiError(500, 'Erro interno'))
    listProjectsMock.mockResolvedValueOnce({ items: [project], total: 1 })

    const wrapper = await mountPage('/busca?q=proj')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('article')).toHaveLength(1)
  })
})
