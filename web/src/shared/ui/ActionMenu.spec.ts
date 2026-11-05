import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ActionMenu from './ActionMenu.vue'

function mountMenu() {
  return mount(ActionMenu, {
    attachTo: document.body,
    props: { label: 'Ações do projeto' },
    slots: {
      default: `
        <a href="#um" role="menuitem" tabindex="-1">Um</a>
        <a href="#dois" role="menuitem" tabindex="-1">Dois</a>
      `,
    },
  })
}

async function openMenu(wrapper: ReturnType<typeof mountMenu>) {
  await wrapper.get('button').trigger('click')
  await flushPromises()
}

function focusedText() {
  return document.activeElement?.textContent
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ActionMenu', () => {
  it('starts closed and describes its state', () => {
    const wrapper = mountMenu()
    const button = wrapper.get('button')

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(button.attributes('aria-label')).toBe('Ações do projeto')
    expect(button.attributes('aria-haspopup')).toBe('menu')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('opens with the focus on the first option', async () => {
    const wrapper = mountMenu()

    await openMenu(wrapper)

    const button = wrapper.get('button')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-controls')).toBe(wrapper.get('[role="menu"]').attributes('id'))
    expect(focusedText()).toBe('Um')
  })

  it('closes when the button is pressed again', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    await wrapper.get('button').trigger('click')

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes with Escape and returns the focus to the button', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    await wrapper.get('[role="menuitem"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('button').element)
  })

  it('closes when the focus leaves with Tab', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    await wrapper.get('[role="menuitem"]').trigger('keydown', { key: 'Tab' })

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes with a click outside, but not with a click inside', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    wrapper.get('[role="menu"]').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes after choosing an option', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    await wrapper.get('[role="menuitem"]').trigger('click')

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('moves between the options with the keyboard', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)
    const menu = wrapper.get('[role="menu"]')

    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(focusedText()).toBe('Dois')

    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(focusedText()).toBe('Um')

    await menu.trigger('keydown', { key: 'ArrowUp' })
    expect(focusedText()).toBe('Dois')

    await menu.trigger('keydown', { key: 'Home' })
    expect(focusedText()).toBe('Um')

    await menu.trigger('keydown', { key: 'End' })
    expect(focusedText()).toBe('Dois')
  })

  it('stops listening to the page when it leaves', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    wrapper.unmount()

    expect(() => document.body.dispatchEvent(new Event('pointerdown'))).not.toThrow()
  })
})
