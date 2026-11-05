import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_COVER_BYTES } from '../validation'
import CoverField from './CoverField.vue'

const png = new File(['image'], 'capa.png', { type: 'image/png' })

function mountField(props: { error?: string } = {}) {
  const wrapper = mount(CoverField, {
    attachTo: document.body,
    props: {
      modelValue: null as File | null,
      'onUpdate:modelValue': (file: File | null) => wrapper.setProps({ modelValue: file }),
      ...props,
    },
  })
  return wrapper
}

async function choose(wrapper: ReturnType<typeof mountField>, file: File) {
  const input = wrapper.get('input')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('CoverField', () => {
  it('invites choosing an image and only offers the accepted formats', () => {
    const wrapper = mountField()

    expect(wrapper.text()).toContain('Escolha uma imagem .jpg ou .png no seu dispositivo')
    expect(wrapper.get('input').attributes('accept')).toContain('image/png')
    expect(wrapper.get('input').attributes('accept')).toContain('image/jpeg')
  })

  it('opens the file dialog from the button', async () => {
    const wrapper = mountField()
    const click = vi.spyOn(wrapper.get('input').element, 'click')

    await wrapper.get('button').trigger('click')

    expect(click).toHaveBeenCalled()
  })

  it('shows the preview of the chosen image', async () => {
    const wrapper = mountField()

    await choose(wrapper, png)

    expect(wrapper.props('modelValue')).toBe(png)
    expect(wrapper.get('img[alt="Prévia da capa"]').attributes('src')).toBe('blob:preview')
    expect(wrapper.text()).not.toContain('Escolha uma imagem')
  })

  it('removes the image and moves the focus to the button that replaces it', async () => {
    const wrapper = mountField()
    await choose(wrapper, png)

    await wrapper.get('button[aria-label="Remover capa"]').trigger('click')
    await flushPromises()

    expect(wrapper.props('modelValue')).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(document.activeElement).toBe(wrapper.get('button').element)
  })

  it('refuses another format without attaching the file', async () => {
    const wrapper = mountField()

    await choose(wrapper, new File(['text'], 'capa.pdf', { type: 'application/pdf' }))

    expect(wrapper.props('modelValue')).toBeNull()
    expect(wrapper.text()).toContain('Escolha uma imagem .jpg ou .png')
    expect(wrapper.find('p.error').text()).toBe('Escolha uma imagem .jpg ou .png')
    expect(wrapper.find('img[alt="Prévia da capa"]').exists()).toBe(false)
  })

  it('refuses a file above the limit', async () => {
    const wrapper = mountField()
    const large = new File([new Uint8Array(MAX_COVER_BYTES + 1)], 'capa.png', { type: 'image/png' })

    await choose(wrapper, large)

    expect(wrapper.props('modelValue')).toBeNull()
    expect(wrapper.find('p.error').text()).toBe('A imagem deve ter até 5 MB')
  })

  it('refuses a file that the browser cannot show, even with the right extension', async () => {
    const wrapper = mountField()
    await choose(wrapper, png)

    await wrapper.get('img[alt="Prévia da capa"]').trigger('error')
    await flushPromises()

    expect(wrapper.props('modelValue')).toBeNull()
    expect(wrapper.find('p.error').text()).toBe('Escolha uma imagem .jpg ou .png')
  })

  it('clears the refusal when a valid image is chosen', async () => {
    const wrapper = mountField()
    await choose(wrapper, new File(['text'], 'capa.pdf', { type: 'application/pdf' }))

    await choose(wrapper, png)

    expect(wrapper.find('p.error').exists()).toBe(false)
  })

  it('shows the error from the API', () => {
    const wrapper = mountField({ error: 'A imagem deve ter até 5 MB' })

    expect(wrapper.find('p.error').text()).toBe('A imagem deve ter até 5 MB')
  })

  it('releases the preview when leaving', async () => {
    const wrapper = mountField()
    await choose(wrapper, png)

    wrapper.unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })
})
