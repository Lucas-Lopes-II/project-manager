import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import router from '@/app/router'
import { ApiError } from '@/shared/api/client'

import { deleteProject, listProjects, setFavorite, type Project, type ProjectList } from '../api'
import { useProjectsStore } from '../store'
import ProjectListPage from './ProjectListPage.vue'

vi.mock('../api', () => ({ deleteProject: vi.fn(), listProjects: vi.fn(), setFavorite: vi.fn() }))

const listProjectsMock = vi.mocked(listProjects)
const deleteProjectMock = vi.mocked(deleteProject)
const setFavoriteMock = vi.mocked(setFavorite)

// The router is shared, so a page left mounted would react to the routes of the next test.
enableAutoUnmount(afterEach)

const emptyList: ProjectList = { items: [], total: 0 }

function mountPage() {
  return mount(ProjectListPage, {
    attachTo: document.body,
    global: { plugins: [createPinia(), router] },
  })
}

function sampleProject(id: string, name: string): Project {
  return {
    id,
    name,
    client: 'Clicksign',
    start_date: '2026-11-05',
    end_date: '2026-12-12',
    favorite: false,
    cover_url: null,
    created_at: '2026-11-05T12:00:00Z',
    updated_at: '2026-11-05T12:00:00Z',
  }
}

async function chooseRemove(wrapper: ReturnType<typeof mountPage>, index = 0) {
  await wrapper.findAll('button[aria-haspopup="menu"]')[index]!.trigger('click')
  await flushPromises()
  await wrapper.get('button[role="menuitem"]').trigger('click')
  await flushPromises()
}

function confirmButton(wrapper: ReturnType<typeof mountPage>) {
  return wrapper.findAll('dialog button')[1]!
}

beforeEach(async () => {
  listProjectsMock.mockReset()
  deleteProjectMock.mockReset()
  setFavoriteMock.mockReset()
  document.body.innerHTML = ''
  await router.replace('/')
})

describe('ProjectListPage', () => {
  it('shows the loading state until the API answers', async () => {
    let answer!: (list: ProjectList) => void
    listProjectsMock.mockReturnValue(new Promise((resolve) => (answer = resolve)))

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe('Carregando projetos...')
    expect(wrapper.text()).not.toContain('Nenhum projeto')

    answer(emptyList)
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe('')
  })

  it('invites the creation of the first project when the list is empty', async () => {
    listProjectsMock.mockResolvedValue(emptyList)

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Nenhum projeto')
    expect(wrapper.text()).toContain('Clique no botão abaixo para criar o primeiro e gerenciá-lo.')

    const link = wrapper.get('a')
    expect(link.text()).toBe('Novo projeto')
    expect(link.attributes('href')).toBe('/projetos/novo')
  })

  it('shows the total informed by the API when there are projects', async () => {
    listProjectsMock.mockResolvedValue({ items: [], total: 3 })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Projetos (3)')
    expect(wrapper.text()).not.toContain('Nenhum projeto')
  })

  it('shows a card for each project and a link to create another', async () => {
    listProjectsMock.mockResolvedValue({
      items: [
        {
          id: '1',
          name: 'Projeto Alfa',
          client: 'Clicksign',
          start_date: '2026-11-05',
          end_date: '2026-12-12',
          favorite: false,
          cover_url: null,
          created_at: '2026-11-05T12:00:00Z',
          updated_at: '2026-11-05T12:00:00Z',
        },
      ],
      total: 1,
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.get('article h2').text()).toBe('Projeto Alfa')
    expect(wrapper.get('a').text()).toBe('Novo projeto')
    expect(wrapper.get('a').attributes('href')).toBe('/projetos/novo')
  })

  it('reports the failure and recovers when trying again', async () => {
    listProjectsMock.mockRejectedValueOnce(new ApiError(500, 'Erro interno'))
    listProjectsMock.mockResolvedValueOnce({ items: [], total: 2 })

    const wrapper = mountPage()
    await flushPromises()

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Não foi possível carregar os projetos.')
    expect(alert.text()).not.toContain('Erro interno')
    expect(wrapper.text()).not.toContain('Nenhum projeto')

    await alert.get('button').trigger('click')
    await flushPromises()

    expect(listProjectsMock).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Projetos (2)')
  })

  it('cancels the search when leaving the page', async () => {
    listProjectsMock.mockReturnValue(new Promise(() => {}))

    const wrapper = mountPage()
    await flushPromises()
    wrapper.unmount()

    expect(listProjectsMock.mock.calls[0]?.[0]?.aborted).toBe(true)
  })

  it('removes a project after the confirmation and updates the total', async () => {
    listProjectsMock.mockResolvedValue({
      items: [sampleProject('1', 'Projeto Alfa'), sampleProject('2', 'Projeto Beta')],
      total: 2,
    })
    deleteProjectMock.mockResolvedValue(undefined)
    const wrapper = mountPage()
    await flushPromises()

    await chooseRemove(wrapper)

    expect(wrapper.get('dialog').attributes('open')).toBeDefined()
    expect(wrapper.get('dialog .name').text()).toBe('Projeto Alfa')

    await confirmButton(wrapper).trigger('click')
    await flushPromises()

    expect(deleteProjectMock).toHaveBeenCalledWith('1')
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Projetos (1)')
    expect(document.activeElement).toBe(wrapper.get('h1').element)
  })

  it('shows the empty list after removing the last project', async () => {
    listProjectsMock.mockResolvedValue({ items: [sampleProject('1', 'Projeto Alfa')], total: 1 })
    deleteProjectMock.mockResolvedValue(undefined)
    const wrapper = mountPage()
    await flushPromises()

    await chooseRemove(wrapper)
    await confirmButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Nenhum projeto')
    expect(document.activeElement).toBe(wrapper.get('h1').element)
  })

  it('keeps the project when the removal is canceled', async () => {
    listProjectsMock.mockResolvedValue({ items: [sampleProject('1', 'Projeto Alfa')], total: 1 })
    const wrapper = mountPage()
    await flushPromises()

    await chooseRemove(wrapper)
    await wrapper.findAll('dialog button')[0]!.trigger('click')
    await flushPromises()

    expect(deleteProjectMock).not.toHaveBeenCalled()
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(document.activeElement).toBe(wrapper.get('button[aria-haspopup="menu"]').element)
  })

  describe('favorites', () => {
    const alfa = { ...sampleProject('1', 'Projeto Alfa'), favorite: true }
    const beta = sampleProject('2', 'Projeto Beta')

    function toggle(wrapper: ReturnType<typeof mountPage>) {
      return wrapper.get('input[role="switch"]')
    }

    it('reads the filter from the address and asks the API for the favorites', async () => {
      listProjectsMock.mockResolvedValue({ items: [alfa], total: 2 })
      await router.replace('/?favoritos=true')

      const wrapper = mountPage()
      await flushPromises()

      expect(listProjectsMock.mock.calls[0]?.[1]).toEqual({
        favoritesOnly: true,
        sort: 'name',
        query: '',
      })
      expect((toggle(wrapper).element as HTMLInputElement).checked).toBe(true)
      expect(wrapper.get('h1').text()).toBe('Projetos (2)')
      expect(useProjectsStore().listQuery).toEqual({ favoritos: 'true' })
    })

    it('writes the filter in the address and keeps the list while it loads', async () => {
      listProjectsMock.mockResolvedValueOnce({ items: [alfa, beta], total: 2 })
      const wrapper = mountPage()
      await flushPromises()

      listProjectsMock.mockReturnValueOnce(new Promise(() => {}))
      await toggle(wrapper).setValue(true)
      await flushPromises()

      expect(router.currentRoute.value.query).toEqual({ favoritos: 'true' })
      expect(listProjectsMock.mock.calls[1]?.[1]).toEqual({
        favoritesOnly: true,
        sort: 'name',
        query: '',
      })
      expect(wrapper.findAll('article')).toHaveLength(2)
      expect(wrapper.get('[role="status"]').text()).toBe('')
    })

    it('shows the state without favorites, with the toolbar to turn the filter off', async () => {
      listProjectsMock.mockResolvedValue({ items: [], total: 2 })
      await router.replace('/?favoritos=true')

      const wrapper = mountPage()
      await flushPromises()

      expect(wrapper.text()).toContain('Nenhum projeto favorito')
      expect(wrapper.text()).toContain('Clique na estrela de um projeto para encontrá-lo aqui.')
      expect(wrapper.find('input[role="switch"]').exists()).toBe(true)
      expect(wrapper.get('h1').text()).toBe('Projetos (2)')
    })

    it('marks a project and reports when the API fails', async () => {
      listProjectsMock.mockResolvedValue({ items: [beta], total: 1 })
      setFavoriteMock.mockRejectedValue(new ApiError(500, 'Erro interno'))
      const wrapper = mountPage()
      await flushPromises()

      await wrapper.get('button[aria-pressed]').trigger('click')
      await flushPromises()

      expect(setFavoriteMock).toHaveBeenCalledWith('2', true)
      expect(wrapper.get('button[aria-pressed]').attributes('aria-pressed')).toBe('false')
      expect(wrapper.get('[role="alert"]').text()).toBe(
        'Não foi possível atualizar o favorito. Tente novamente.',
      )
    })

    it('takes an unmarked project out of the favorites and moves the focus to the title', async () => {
      listProjectsMock.mockResolvedValue({ items: [alfa], total: 2 })
      setFavoriteMock.mockResolvedValue(undefined)
      await router.replace('/?favoritos=true')
      const wrapper = mountPage()
      await flushPromises()

      await wrapper.get('button[aria-pressed]').trigger('click')
      await flushPromises()

      expect(setFavoriteMock).toHaveBeenCalledWith('1', false)
      expect(wrapper.find('article').exists()).toBe(false)
      expect(wrapper.text()).toContain('Nenhum projeto favorito')
      expect(document.activeElement).toBe(wrapper.get('h1').element)
    })
  })

  describe('sort', () => {
    it('reads the order from the address and asks the API for it', async () => {
      listProjectsMock.mockResolvedValue({ items: [sampleProject('1', 'Projeto Alfa')], total: 1 })
      await router.replace('/?ordem=prazo&favoritos=true')

      const wrapper = mountPage()
      await flushPromises()

      expect(listProjectsMock.mock.calls[0]?.[1]).toEqual({
        favoritesOnly: true,
        sort: 'deadline',
        query: '',
      })
      expect(wrapper.get('[role="combobox"]').text()).toBe('Prazo mais próximo')
    })

    it('writes the chosen order in the address, and leaves the default one out', async () => {
      listProjectsMock.mockResolvedValue({ items: [sampleProject('1', 'Projeto Alfa')], total: 1 })
      const wrapper = mountPage()
      await flushPromises()
      const combobox = wrapper.get('[role="combobox"]')

      await combobox.trigger('click')
      await wrapper.findAll('[role="option"]')[1]!.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.query).toEqual({ ordem: 'recentes' })
      expect(listProjectsMock.mock.calls[1]?.[1]).toEqual({
        favoritesOnly: false,
        sort: 'recent',
        query: '',
      })

      await combobox.trigger('click')
      await wrapper.findAll('[role="option"]')[0]!.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.query).toEqual({})
    })

    it('treats an unknown order in the address as the alphabetical one', async () => {
      listProjectsMock.mockResolvedValue({ items: [sampleProject('1', 'Projeto Alfa')], total: 1 })
      await router.replace('/?ordem=outra')

      const wrapper = mountPage()
      await flushPromises()

      expect(listProjectsMock.mock.calls[0]?.[1]).toEqual({
        favoritesOnly: false,
        sort: 'name',
        query: '',
      })
      expect(wrapper.get('[role="combobox"]').text()).toBe('Ordem alfabética')
    })
  })
})
