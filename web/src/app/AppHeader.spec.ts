import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppHeader from './AppHeader.vue'
import router from './router'

describe('AppHeader', () => {
  const wrapper = mount(AppHeader, { global: { plugins: [router] } })

  it('links the logo to the project list', () => {
    const link = wrapper.get('a')

    expect(link.attributes('href')).toBe('/')
    expect(link.get('img').attributes('alt')).toBe('Gerenciador de Projetos')
  })

  it('names the search button for assistive technology', () => {
    const button = wrapper.get('button')

    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Buscar projetos')
  })

  it('hides the search on the form pages, as in the design', async () => {
    await router.push('/projetos/novo')
    await flushPromises()

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('img').attributes('alt')).toBe('Gerenciador de Projetos')

    await router.push('/')
    await flushPromises()

    expect(wrapper.find('button').exists()).toBe(true)
  })
})
