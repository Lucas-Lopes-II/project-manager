import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ProjectForm from './ProjectForm.vue'

type Props = InstanceType<typeof ProjectForm>['$props']

function mountForm(props: Props = {}) {
  return mount(ProjectForm, { props })
}

function inputs(wrapper: ReturnType<typeof mountForm>) {
  const [name, client, start, end] = wrapper.findAll('.control')
  return { name: name!, client: client!, start: start!, end: end! }
}

async function fill(wrapper: ReturnType<typeof mountForm>) {
  const fields = inputs(wrapper)
  await fields.name.setValue('Projeto Iridium')
  await fields.client.setValue('Clicksign')
  await fields.start.setValue('2026-11-05')
  await fields.end.setValue('2026-12-12')
  return fields
}

function saveButton(wrapper: ReturnType<typeof mountForm>) {
  return wrapper.get('button[type="submit"]')
}

describe('ProjectForm', () => {
  it('starts with the save button disabled and without errors', () => {
    const wrapper = mountForm()

    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.find('.error').exists()).toBe(false)
  })

  it('enables the save button when the required fields are valid', async () => {
    const wrapper = mountForm()

    await fill(wrapper)

    expect(saveButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('only shows the rule of a field after the person leaves it', async () => {
    const wrapper = mountForm()
    const { name } = inputs(wrapper)

    await name.setValue('Iridium')
    expect(wrapper.text()).not.toContain('Por favor, digite ao menos duas palavras')

    await name.trigger('blur')
    expect(wrapper.text()).toContain('Por favor, digite ao menos duas palavras')
    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()

    await name.setValue('Projeto Iridium')
    expect(wrapper.text()).not.toContain('Por favor, digite ao menos duas palavras')
  })

  it('does not mark a field that the person has not visited', async () => {
    const wrapper = mountForm()

    await inputs(wrapper).name.trigger('blur')

    expect(wrapper.findAll('.error')).toHaveLength(1)
  })

  it('marks both dates when the end is not after the start', async () => {
    const wrapper = mountForm()
    const { start, end } = await fill(wrapper)

    await end.setValue('2026-11-05')
    await start.trigger('blur')
    await end.trigger('blur')

    expect(wrapper.findAll('.error').map((error) => error.text())).toEqual([
      'Selecione uma data válida',
      'Selecione uma data válida',
    ])
    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('submits the values', async () => {
    const wrapper = mountForm()
    await fill(wrapper)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Projeto Iridium',
          client: 'Clicksign',
          start_date: '2026-11-05',
          end_date: '2026-12-12',
          cover: null,
        },
      ],
    ])
  })

  it('does not submit invalid values, even with the Enter key', async () => {
    const wrapper = mountForm()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('does not submit twice while saving', async () => {
    const wrapper = mountForm({ saving: true })
    await fill(wrapper)

    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('shows the errors from the API and tells the parent about any change', async () => {
    const wrapper = mountForm({ serverErrors: { name: 'Erro da API', cover: 'Capa inválida' } })
    await fill(wrapper)
    await flushPromises()

    expect(wrapper.text()).toContain('Erro da API')
    expect(wrapper.text()).toContain('Capa inválida')
    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('announces a failure and keeps the button available to try again', async () => {
    const wrapper = mountForm({ failure: 'Não foi possível salvar o projeto. Tente novamente.' })
    await fill(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Não foi possível salvar o projeto. Tente novamente.',
    )
    expect(saveButton(wrapper).attributes('disabled')).toBeUndefined()
  })
})
