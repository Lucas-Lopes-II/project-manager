import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { listProjects } from '@/features/projects/api'

import App from './App.vue'
import router from './router'

vi.mock('@/features/projects/api', () => ({ listProjects: vi.fn(), createProject: vi.fn() }))

const listProjectsMock = vi.mocked(listProjects)

enableAutoUnmount(afterEach)

const project = {
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

async function mountApp(path: string) {
  await router.replace(path)
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [createPinia(), router] },
  })
  await flushPromises()
  return wrapper
}

// The pages are loaded on demand, so a navigation takes a moment to render.
async function navigate(path: string) {
  await router.push(path)
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

beforeEach(() => {
  listProjectsMock.mockReset()
  listProjectsMock.mockResolvedValue({ items: [project], total: 1 })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('App', () => {
  it('leaves the focus of the first page as the browser sets it', async () => {
    await mountApp('/')

    expect(document.activeElement).toBe(document.body)
  })

  it('moves the focus to the title of a new page', async () => {
    const wrapper = await mountApp('/')

    await navigate('/projetos/novo')

    expect(document.activeElement?.tagName).toBe('H1')
    expect(document.activeElement?.textContent).toBe('Novo projeto')
    expect(wrapper.get('main').attributes('tabindex')).toBe('-1')
  })

  it('moves the focus to the content while the title of the page loads', async () => {
    const wrapper = await mountApp('/projetos/novo')
    listProjectsMock.mockReturnValue(new Promise(() => {}))

    await navigate('/')

    expect(document.activeElement).toBe(wrapper.get('main').element)
  })

  it('keeps the focus in the search while the result page opens', async () => {
    const wrapper = await mountApp('/')
    await wrapper.get('button[aria-label="Buscar projetos"]').trigger('click')
    await flushPromises()
    const input = wrapper.get('input[type="search"]').element

    await navigate('/busca?q=alfa')

    expect(document.activeElement).toBe(input)
  })
})
