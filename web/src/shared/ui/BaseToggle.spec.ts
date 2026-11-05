import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BaseToggle from './BaseToggle.vue'

function mountToggle(modelValue: boolean) {
  const wrapper = mount(BaseToggle, {
    props: {
      modelValue,
      'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }),
    },
    slots: { default: 'Apenas Favoritos' },
  })
  return wrapper
}

describe('BaseToggle', () => {
  it('is a switch named by its text', () => {
    const wrapper = mountToggle(false)
    const input = wrapper.get('input')

    expect(input.attributes('type')).toBe('checkbox')
    expect(input.attributes('role')).toBe('switch')
    expect(wrapper.get('label').text()).toBe('Apenas Favoritos')
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('reflects and changes the model', async () => {
    const wrapper = mountToggle(true)
    const input = wrapper.get('input')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await input.setValue(false)

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})
