import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import router from '@/app/router'
import { ApiError } from '@/shared/api/client'

import { getProject, listProjects, updateProject, type Project } from '../api'
import ProjectEditPage from './ProjectEditPage.vue'

vi.mock('../api', () => ({
  getProject: vi.fn(),
  listProjects: vi.fn(),
  updateProject: vi.fn(),
}))

const getProjectMock = vi.mocked(getProject)
const updateProjectMock = vi.mocked(updateProject)

const project: Project = {
  id: '1',
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  cover_url: '/api/v1/projects/1/cover?v=1',
  created_at: '2026-11-05T12:00:00Z',
  updated_at: '2026-11-05T12:00:00Z',
}

async function mountPage() {
  await router.push('/projetos/1/editar')
  return mount(ProjectEditPage, {
    props: { id: '1' },
    global: { plugins: [createPinia(), router] },
  })
}

async function expectListRoute() {
  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('projects'))
}

beforeEach(() => {
  getProjectMock.mockReset()
  updateProjectMock.mockReset()
  vi.mocked(listProjects).mockResolvedValue({ items: [], total: 0 })
})

describe('ProjectEditPage', () => {
  it('shows the loading state until the API answers', async () => {
    getProjectMock.mockReturnValue(new Promise(() => {}))

    const wrapper = await mountPage()
    await flushPromises()

    expect(getProjectMock.mock.calls[0]?.[0]).toBe('1')
    expect(wrapper.get('[role="status"]').text()).toBe('Carregando projeto...')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows the form filled with the project', async () => {
    getProjectMock.mockResolvedValue(project)

    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Editar projeto')
    expect(wrapper.get('[role="status"]').text()).toBe('')
    expect((wrapper.find('.control').element as HTMLInputElement).value).toBe('Projeto Iridium')
    expect(wrapper.get('img[alt="Prévia da capa"]').attributes('src')).toBe(project.cover_url)
  })

  it('saves the changes and returns to the list', async () => {
    getProjectMock.mockResolvedValue(project)
    updateProjectMock.mockResolvedValue(project)
    const wrapper = await mountPage()
    await flushPromises()

    await wrapper.find('.control').setValue('Projeto Novo')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(updateProjectMock.mock.calls[0]?.[0]).toBe('1')
    expect(updateProjectMock.mock.calls[0]?.[1].name).toBe('Projeto Novo')
    await expectListRoute()
  })

  it('keeps the data and reports a failure when saving', async () => {
    getProjectMock.mockResolvedValue(project)
    updateProjectMock.mockRejectedValue(new ApiError(500, 'Erro interno'))
    const wrapper = await mountPage()
    await flushPromises()

    await wrapper.find('.control').setValue('Projeto Novo')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Não foi possível salvar o projeto. Tente novamente.',
    )
    expect((wrapper.find('.control').element as HTMLInputElement).value).toBe('Projeto Novo')
  })

  it('reports a project that does not exist', async () => {
    getProjectMock.mockRejectedValue(new ApiError(404, 'Projeto não encontrado.'))

    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Projeto não encontrado')
    expect(wrapper.text()).toContain(
      'Ele pode ter sido removido. Volte para a lista para ver os projetos cadastrados.',
    )
    expect(wrapper.get('a').text()).toBe('Voltar para a lista')
    expect(wrapper.get('a').attributes('href')).toBe('/')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('reports a project removed while it was being edited', async () => {
    getProjectMock.mockResolvedValue(project)
    updateProjectMock.mockRejectedValue(new ApiError(404, 'Projeto não encontrado.'))
    const wrapper = await mountPage()
    await flushPromises()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Projeto não encontrado')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('reports a failure when loading and recovers when trying again', async () => {
    getProjectMock.mockRejectedValueOnce(new ApiError(500, 'Erro interno'))
    getProjectMock.mockResolvedValueOnce(project)

    const wrapper = await mountPage()
    await flushPromises()

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Não foi possível carregar o projeto.')
    expect(alert.text()).not.toContain('Erro interno')

    await alert.get('button').trigger('click')
    await flushPromises()

    expect(getProjectMock).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Editar projeto')
  })

  it('cancels the request when leaving the page', async () => {
    getProjectMock.mockReturnValue(new Promise(() => {}))

    const wrapper = await mountPage()
    await flushPromises()
    wrapper.unmount()

    expect(getProjectMock.mock.calls[0]?.[1]?.aborted).toBe(true)
  })
})
