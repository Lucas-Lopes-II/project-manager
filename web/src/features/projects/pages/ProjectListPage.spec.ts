import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import router from '@/app/router'
import { ApiError } from '@/shared/api/client'

import { listProjects, type ProjectList } from '../api'
import ProjectListPage from './ProjectListPage.vue'

vi.mock('../api', () => ({ listProjects: vi.fn() }))

const listProjectsMock = vi.mocked(listProjects)

const emptyList: ProjectList = { items: [], total: 0 }

function mountPage() {
  return mount(ProjectListPage, { global: { plugins: [createPinia(), router] } })
}

beforeEach(() => {
  listProjectsMock.mockReset()
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
})
