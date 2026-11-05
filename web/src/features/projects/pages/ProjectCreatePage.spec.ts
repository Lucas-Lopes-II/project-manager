import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import router from '@/app/router'
import { ApiError } from '@/shared/api/client'

import { createProject, listProjects, type Project } from '../api'
import ProjectCreatePage from './ProjectCreatePage.vue'

vi.mock('../api', () => ({ createProject: vi.fn(), listProjects: vi.fn() }))

const createProjectMock = vi.mocked(createProject)

const FAILURE = 'Não foi possível salvar o projeto. Tente novamente.'

async function mountFilled() {
  await router.push('/projetos/novo')
  const wrapper = mount(ProjectCreatePage, { global: { plugins: [createPinia(), router] } })

  const [name, client, start, end] = wrapper.findAll('.control')
  await name!.setValue('Projeto Iridium')
  await client!.setValue('Clicksign')
  await start!.setValue('2026-11-05')
  await end!.setValue('2026-12-12')
  return wrapper
}

async function save(wrapper: Awaited<ReturnType<typeof mountFilled>>) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

// The list page is loaded on demand, so the navigation takes a moment.
async function expectListRoute() {
  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('projects'))
}

beforeEach(() => {
  createProjectMock.mockReset()
  vi.mocked(listProjects).mockResolvedValue({ items: [], total: 0 })
})

describe('ProjectCreatePage', () => {
  it('has a way back to the list', async () => {
    const wrapper = await mountFilled()

    expect(wrapper.get('h1').text()).toBe('Novo projeto')
    expect(wrapper.get('a').text()).toBe('Voltar')
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })

  it('saves and returns to the list', async () => {
    createProjectMock.mockResolvedValue({ id: '1' } as Project)
    const wrapper = await mountFilled()

    await save(wrapper)

    expect(createProjectMock).toHaveBeenCalledTimes(1)
    expect(createProjectMock.mock.calls[0]?.[0].name).toBe('Projeto Iridium')
    await expectListRoute()
  })

  it('stays disabled after saving, so that the project is not created twice', async () => {
    createProjectMock.mockResolvedValue({ id: '1' } as Project)
    const wrapper = await mountFilled()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await expectListRoute()
  })

  it('keeps the data and offers another attempt when saving fails', async () => {
    createProjectMock.mockRejectedValueOnce(new ApiError(500, 'Erro interno'))
    createProjectMock.mockResolvedValueOnce({ id: '1' } as Project)
    const wrapper = await mountFilled()

    await save(wrapper)

    expect(router.currentRoute.value.name).toBe('project-new')
    expect(wrapper.get('[role="alert"]').text()).toBe(FAILURE)
    expect(wrapper.text()).not.toContain('Erro interno')
    expect((wrapper.find('.control').element as HTMLInputElement).value).toBe('Projeto Iridium')

    await save(wrapper)

    expect(createProjectMock).toHaveBeenCalledTimes(2)
    await expectListRoute()
  })

  it('also reports a connection failure', async () => {
    createProjectMock.mockRejectedValue(new ApiError(0, 'Não foi possível conectar à API.'))
    const wrapper = await mountFilled()

    await save(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe(FAILURE)
  })

  it('shows the errors of the API on their fields until the form changes', async () => {
    createProjectMock.mockRejectedValue(
      new ApiError(422, 'Inválido', [{ field: 'cover', code: 'invalid_image' }]),
    )
    const wrapper = await mountFilled()

    await save(wrapper)

    expect(wrapper.find('p.error').text()).toBe('Escolha uma imagem .jpg ou .png')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.find('.control').setValue('Projeto Novo')

    expect(wrapper.find('p.error').exists()).toBe(false)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('points a body above the limit to the cover', async () => {
    createProjectMock.mockRejectedValue(new ApiError(413, 'Muito grande'))
    const wrapper = await mountFilled()

    await save(wrapper)

    expect(wrapper.find('p.error').text()).toBe('A imagem deve ter até 5 MB')
  })
})
