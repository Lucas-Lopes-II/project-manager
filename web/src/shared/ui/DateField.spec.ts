import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DateField from './DateField.vue'

function mountField(props: { modelValue?: string; error?: string } = {}) {
  return mount(DateField, {
    props: { modelValue: '', label: 'Data de Início', icon: 'icon.svg', required: true, ...props },
  })
}

describe('DateField', () => {
  it('uses the native date input, tied to its label', () => {
    const wrapper = mountField()
    const input = wrapper.get('input')

    expect(input.attributes('type')).toBe('date')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('label').text()).toContain('Data de Início')
    expect(wrapper.get('label').text()).toContain('(Obrigatório)')
  })

  it('keeps the year with four digits', () => {
    expect(mountField().get('input').attributes('max')).toBe('9999-12-31')
  })

  it('only marks the field as empty while it has no date', () => {
    expect(mountField().get('input').classes()).toContain('empty')
    expect(mountField({ modelValue: '2026-11-05' }).get('input').classes()).not.toContain('empty')
  })

  it('updates the model and tells when the person leaves', async () => {
    const wrapper = mountField()
    const input = wrapper.get('input')

    await input.setValue('2026-11-05')
    await input.trigger('blur')

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-05']])
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('ties the error to the input', () => {
    const wrapper = mountField({ error: 'Selecione uma data válida' })
    const input = wrapper.get('input')
    const error = wrapper.get(`#${input.attributes('aria-describedby')}`)

    expect(error.text()).toBe('Selecione uma data válida')
    expect(input.attributes('aria-invalid')).toBe('true')
  })
})
