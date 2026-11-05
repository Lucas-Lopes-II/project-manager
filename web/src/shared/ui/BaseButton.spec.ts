import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('renders a button that does not submit forms by default', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Salvar' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Salvar')
  })

  it('renders a link when it receives a route', () => {
    const wrapper = mount(BaseButton, {
      props: { to: '/projetos/novo' },
      slots: { default: 'Novo projeto' },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/projetos/novo')
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
