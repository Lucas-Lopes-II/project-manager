import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import BaseSelect from './BaseSelect.vue'

const options = [
  { value: 'name', label: 'Ordem alfabética' },
  { value: 'recent', label: 'Iniciados mais recentes' },
  { value: 'deadline', label: 'Prazo mais próximo' },
]

function mountSelect(modelValue = 'name') {
  const wrapper = mount(BaseSelect, {
    attachTo: document.body,
    props: {
      modelValue,
      options,
      label: 'Ordenar projetos',
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
  })
  return wrapper
}

function parts(wrapper: ReturnType<typeof mountSelect>) {
  return {
    combobox: wrapper.get('[role="combobox"]'),
    listbox: wrapper.get('[role="listbox"]'),
  }
}

function isOpen(wrapper: ReturnType<typeof mountSelect>) {
  return parts(wrapper).combobox.attributes('aria-expanded') === 'true'
}

function activeLabel(wrapper: ReturnType<typeof mountSelect>) {
  const id = parts(wrapper).combobox.attributes('aria-activedescendant')
  return id ? wrapper.get(`[id="${id}"]`).text() : undefined
}

async function press(
  wrapper: ReturnType<typeof mountSelect>,
  key: string,
  init: KeyboardEventInit = {},
) {
  await parts(wrapper).combobox.trigger('keydown', { key, ...init })
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('BaseSelect', () => {
  it('shows the chosen option and describes itself as a closed combobox', () => {
    const wrapper = mountSelect('recent')
    const { combobox, listbox } = parts(wrapper)

    expect(combobox.text()).toBe('Iniciados mais recentes')
    expect(combobox.attributes('aria-label')).toBe('Ordenar projetos')
    expect(combobox.attributes('aria-haspopup')).toBe('listbox')
    expect(combobox.attributes('aria-controls')).toBe(listbox.attributes('id'))
    expect(combobox.attributes('tabindex')).toBe('0')
    expect(isOpen(wrapper)).toBe(false)
    expect(combobox.attributes('aria-activedescendant')).toBeUndefined()
  })

  it('marks the chosen option', () => {
    const wrapper = mountSelect('deadline')

    expect(
      wrapper.findAll('[role="option"]').map((option) => option.attributes('aria-selected')),
    ).toEqual(['false', 'false', 'true'])
  })

  it('opens on the chosen option and chooses another with the mouse', async () => {
    const wrapper = mountSelect('recent')

    await parts(wrapper).combobox.trigger('click')
    expect(isOpen(wrapper)).toBe(true)
    expect(activeLabel(wrapper)).toBe('Iniciados mais recentes')

    await wrapper.findAll('[role="option"]')[2]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['deadline']])
    expect(isOpen(wrapper)).toBe(false)
  })

  it.each(['ArrowDown', 'ArrowUp', 'Enter', ' '])('opens with %s', async (key) => {
    const wrapper = mountSelect()

    await press(wrapper, key)

    expect(isOpen(wrapper)).toBe(true)
    expect(activeLabel(wrapper)).toBe('Ordem alfabética')
  })

  it('opens on the first or last option with Home and End', async () => {
    const wrapper = mountSelect('recent')

    await press(wrapper, 'End')
    expect(activeLabel(wrapper)).toBe('Prazo mais próximo')

    await press(wrapper, 'Escape')
    await press(wrapper, 'Home')
    expect(activeLabel(wrapper)).toBe('Ordem alfabética')
  })

  it('moves the active option without passing the ends, and chooses it with Enter', async () => {
    const wrapper = mountSelect()
    await press(wrapper, 'ArrowDown')

    await press(wrapper, 'ArrowUp')
    expect(activeLabel(wrapper)).toBe('Ordem alfabética')

    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')
    expect(activeLabel(wrapper)).toBe('Prazo mais próximo')

    await press(wrapper, 'Enter')
    expect(wrapper.emitted('update:modelValue')).toEqual([['deadline']])
    expect(isOpen(wrapper)).toBe(false)
  })

  it('closes with Escape without changing the value', async () => {
    const wrapper = mountSelect()
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')

    await press(wrapper, 'Escape')

    expect(isOpen(wrapper)).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('chooses the active option with Space, Alt+ArrowUp and Tab', async () => {
    const wrapper = mountSelect()

    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')
    await press(wrapper, ' ')

    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowUp', { altKey: true })

    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowUp')
    await press(wrapper, 'Tab')

    expect(wrapper.emitted('update:modelValue')).toEqual([['recent'], ['deadline'], ['recent']])
  })

  it('goes to the option that starts with the typed letters, ignoring accents', async () => {
    vi.useFakeTimers()
    const wrapper = mountSelect()

    await press(wrapper, 'p')
    expect(isOpen(wrapper)).toBe(true)
    expect(activeLabel(wrapper)).toBe('Prazo mais próximo')

    vi.advanceTimersByTime(600)
    await press(wrapper, 'I')
    expect(activeLabel(wrapper)).toBe('Iniciados mais recentes')

    vi.advanceTimersByTime(600)
    await press(wrapper, 'o')
    await press(wrapper, 'r')
    expect(activeLabel(wrapper)).toBe('Ordem alfabética')
  })

  it('closes when the focus leaves, without changing the value', async () => {
    const wrapper = mountSelect()
    await parts(wrapper).combobox.trigger('click')

    await parts(wrapper).combobox.trigger('blur')

    expect(isOpen(wrapper)).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('ignores the keys it does not handle', async () => {
    const wrapper = mountSelect()

    await press(wrapper, 'Tab')
    await press(wrapper, 'a', { ctrlKey: true })

    expect(isOpen(wrapper)).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
