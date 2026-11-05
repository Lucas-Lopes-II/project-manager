import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api/client'

import { deleteProject, type Project } from '../api'
import { useProjectsStore } from '../store'
import RemoveProjectDialog from './RemoveProjectDialog.vue'

vi.mock('../api', () => ({ deleteProject: vi.fn(), listProjects: vi.fn() }))

const deleteProjectMock = vi.mocked(deleteProject)

const project: Project = {
  id: '1',
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  cover_url: null,
  created_at: '2026-11-05T12:00:00Z',
  updated_at: '2026-11-05T12:00:00Z',
}

function mountDialog() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useProjectsStore()
  store.items = [project]
  store.total = 1

  const wrapper = mount(RemoveProjectDialog, {
    attachTo: document.body,
    props: { project: null as Project | null },
    global: { plugins: [pinia] },
  })
  return { wrapper, store }
}

async function open(wrapper: ReturnType<typeof mountDialog>['wrapper']) {
  await wrapper.setProps({ project })
  await flushPromises()
}

function buttons(wrapper: ReturnType<typeof mountDialog>['wrapper']) {
  const [cancel, confirm] = wrapper.findAll('button')
  return { cancel: cancel!, confirm: confirm! }
}

beforeEach(() => {
  deleteProjectMock.mockReset()
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('RemoveProjectDialog', () => {
  it('opens with the texts of the design and the name of the project', async () => {
    const { wrapper } = mountDialog()
    const dialog = wrapper.get('dialog')
    expect(dialog.attributes('open')).toBeUndefined()

    await open(wrapper)

    expect(dialog.attributes('open')).toBeDefined()
    expect(dialog.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))
    expect(wrapper.get('h2').text()).toBe('Remover projeto')
    expect(wrapper.text()).toContain('Essa ação removerá definitivamente o projeto:')
    expect(wrapper.get('.name').text()).toBe('Projeto Iridium')
    expect(buttons(wrapper).cancel.text()).toBe('Cancelar')
    expect(buttons(wrapper).confirm.text()).toBe('Confirmar')
  })

  it('removes the project and tells the page', async () => {
    deleteProjectMock.mockResolvedValue(undefined)
    const { wrapper, store } = mountDialog()
    await open(wrapper)

    await buttons(wrapper).confirm.trigger('click')
    await flushPromises()

    expect(deleteProjectMock).toHaveBeenCalledWith('1')
    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
    expect(wrapper.emitted('removed')).toHaveLength(1)
  })

  it('cannot be closed or used twice while removing', async () => {
    let answer!: () => void
    deleteProjectMock.mockReturnValue(new Promise((resolve) => (answer = () => resolve())))
    const { wrapper } = mountDialog()
    await open(wrapper)

    await buttons(wrapper).confirm.trigger('click')

    expect(buttons(wrapper).confirm.attributes('disabled')).toBeDefined()
    expect(buttons(wrapper).cancel.attributes('disabled')).toBeDefined()

    await wrapper.get('dialog').trigger('cancel')
    await wrapper.get('dialog').trigger('click')
    await buttons(wrapper).confirm.trigger('click')

    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(deleteProjectMock).toHaveBeenCalledTimes(1)

    answer()
    await flushPromises()
    expect(wrapper.emitted('removed')).toHaveLength(1)
  })

  it('keeps the project and offers another attempt when removing fails', async () => {
    deleteProjectMock.mockRejectedValueOnce(new ApiError(500, 'Erro interno'))
    deleteProjectMock.mockResolvedValueOnce(undefined)
    const { wrapper, store } = mountDialog()
    await open(wrapper)

    await buttons(wrapper).confirm.trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Não foi possível remover o projeto. Tente novamente.',
    )
    expect(wrapper.text()).not.toContain('Erro interno')
    expect(store.items).toEqual([project])
    expect(wrapper.emitted('removed')).toBeUndefined()
    expect(buttons(wrapper).confirm.attributes('disabled')).toBeUndefined()

    await buttons(wrapper).confirm.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('removed')).toHaveLength(1)
  })

  it('returns the focus to the confirm button after a failure', async () => {
    deleteProjectMock.mockRejectedValue(new ApiError(500, 'Erro interno'))
    const { wrapper } = mountDialog()
    await open(wrapper)

    await buttons(wrapper).confirm.trigger('click')
    await flushPromises()

    expect(document.activeElement).toBe(buttons(wrapper).confirm.element)
  })

  it('tells the page when the browser closes the dialog by itself', async () => {
    const { wrapper } = mountDialog()
    await open(wrapper)

    wrapper.get('dialog').element.close()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('treats a project already removed by someone else as removed', async () => {
    deleteProjectMock.mockRejectedValue(new ApiError(404, 'Projeto não encontrado.'))
    const { wrapper, store } = mountDialog()
    await open(wrapper)

    await buttons(wrapper).confirm.trigger('click')
    await flushPromises()

    expect(store.items).toEqual([])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('removed')).toHaveLength(1)
  })

  it.each([
    [
      'the cancel button',
      (wrapper: ReturnType<typeof mountDialog>['wrapper']) =>
        buttons(wrapper).cancel.trigger('click'),
    ],
    [
      'the Escape key',
      (wrapper: ReturnType<typeof mountDialog>['wrapper']) =>
        wrapper.get('dialog').trigger('cancel'),
    ],
    [
      'a click outside',
      (wrapper: ReturnType<typeof mountDialog>['wrapper']) =>
        wrapper.get('dialog').trigger('click'),
    ],
  ])('cancels with %s, without removing', async (_, action) => {
    const { wrapper } = mountDialog()
    await open(wrapper)

    await action(wrapper)

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(deleteProjectMock).not.toHaveBeenCalled()
  })

  it('does not cancel with a click inside the content', async () => {
    const { wrapper } = mountDialog()
    await open(wrapper)

    await wrapper.get('.content').trigger('click')

    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('closes when the page has no project to remove anymore', async () => {
    const { wrapper } = mountDialog()
    await open(wrapper)

    await wrapper.setProps({ project: null })
    await flushPromises()

    expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
  })

  it('clears the previous failure when it opens again', async () => {
    deleteProjectMock.mockRejectedValue(new ApiError(500, 'Erro interno'))
    const { wrapper } = mountDialog()
    await open(wrapper)
    await buttons(wrapper).confirm.trigger('click')
    await flushPromises()

    await wrapper.setProps({ project: null })
    await open(wrapper)

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
