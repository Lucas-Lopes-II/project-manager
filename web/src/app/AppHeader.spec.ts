import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppHeader from './AppHeader.vue'
import router from './router'

enableAutoUnmount(afterEach)

function mountHeader() {
  return mount(AppHeader, { attachTo: document.body, global: { plugins: [router] } })
}

async function openBar(wrapper: ReturnType<typeof mountHeader>) {
  await wrapper.get('button[aria-label="Buscar projetos"]').trigger('click')
  await flushPromises()
  return wrapper.get('input[type="search"]')
}

async function type(input: ReturnType<ReturnType<typeof mountHeader>['get']>, text: string) {
  await input.setValue(text)
  await input.trigger('input')
}

beforeEach(async () => {
  vi.useFakeTimers()
  await router.replace('/')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('AppHeader', () => {
  it('links the logo to the project list', () => {
    const wrapper = mountHeader()
    const link = wrapper.get('a')

    expect(link.attributes('href')).toBe('/')
    expect(link.get('img').attributes('alt')).toBe('Gerenciador de Projetos')
  })

  it('names the search button for assistive technology', () => {
    const button = mountHeader().get('button')

    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Buscar projetos')
  })

  it('hides the search on the form pages, as in the design', async () => {
    const wrapper = mountHeader()

    for (const path of ['/projetos/novo', '/projetos/1/editar']) {
      await router.push(path)
      await flushPromises()
      expect(wrapper.find('button').exists()).toBe(false)
    }

    await router.push('/')
    await flushPromises()
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('replaces the header with the bar and moves the focus to it', async () => {
    const wrapper = mountHeader()

    const input = await openBar(wrapper)

    expect(wrapper.find('img[alt="Gerenciador de Projetos"]').exists()).toBe(false)
    expect(wrapper.get('form').attributes('role')).toBe('search')
    expect(input.attributes('placeholder')).toBe('Digite o nome do projeto...')
    expect(input.attributes('aria-label')).toBe('Buscar projetos pelo nome')
    expect(document.activeElement).toBe(input.element)
  })

  it('opens the result page from 3 characters, 300 ms after the last key', async () => {
    const wrapper = mountHeader()
    const input = await openBar(wrapper)
    const push = vi.spyOn(router, 'push')

    await type(input, 'pr')
    vi.advanceTimersByTime(1000)
    expect(push).not.toHaveBeenCalled()

    await type(input, 'pro')
    vi.advanceTimersByTime(299)
    expect(push).not.toHaveBeenCalled()

    await type(input, '  proj  ')
    vi.advanceTimersByTime(300)
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({ name: 'project-search', query: { q: 'proj' } })
  })

  it('searches at once with Enter', async () => {
    const wrapper = mountHeader()
    const input = await openBar(wrapper)
    const push = vi.spyOn(router, 'push')

    await type(input, 'projeto')
    await wrapper.get('form').trigger('submit')

    expect(push).toHaveBeenCalledWith({ name: 'project-search', query: { q: 'projeto' } })
    vi.advanceTimersByTime(300)
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('replaces the address on the result page, and keeps the bar open with the term', async () => {
    await router.push('/busca?q=proj')
    const wrapper = mountHeader()
    await flushPromises()
    const input = wrapper.get('input[type="search"]')
    const replace = vi.spyOn(router, 'replace')

    expect((input.element as HTMLInputElement).value).toBe('proj')

    await type(input, 'projeto')
    vi.advanceTimersByTime(300)

    expect(replace).toHaveBeenCalledWith({ name: 'project-search', query: { q: 'projeto' } })
  })

  it('clears the term with Escape and then closes, returning the focus to the button', async () => {
    const wrapper = mountHeader()
    const input = await openBar(wrapper)
    await type(input, 'pr')

    await input.trigger('keydown', { key: 'Escape' })
    expect((input.element as HTMLInputElement).value).toBe('')

    await input.trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('button[aria-label="Buscar projetos"]').element)
  })

  it('closes an empty bar when the focus leaves it, but not a bar with a term', async () => {
    const wrapper = mountHeader()
    const input = await openBar(wrapper)

    await type(input, 'pr')
    await wrapper.get('form').trigger('focusout', { relatedTarget: null })
    expect(wrapper.find('form').exists()).toBe(true)

    await type(input, '')
    await wrapper.get('form').trigger('focusout', { relatedTarget: null })
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('closes the bar when leaving the result page', async () => {
    await router.push('/busca?q=proj')
    const wrapper = mountHeader()
    await flushPromises()

    await router.push('/')
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('img[alt="Gerenciador de Projetos"]').exists()).toBe(true)
  })
})
