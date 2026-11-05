import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { Project } from '../api'
import ProjectForm from './ProjectForm.vue'

type Props = InstanceType<typeof ProjectForm>['$props']

const project: Project = {
  id: '1',
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  cover_url: '/api/v1/projects/1/cover?v=1',
  created_at: '2026-11-05T12:00:00Z',
  updated_at: '2026-11-05T12:00:00Z',
}

const unchanged = {
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  cover: null,
  removeCover: false,
}

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
          removeCover: false,
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

  describe('with a project to edit', () => {
    it('starts with its values and its cover, and allows saving right away', () => {
      const wrapper = mountForm({ project })
      const { name, client, start, end } = inputs(wrapper)

      expect((name.element as HTMLInputElement).value).toBe('Projeto Iridium')
      expect((client.element as HTMLInputElement).value).toBe('Clicksign')
      expect((start.element as HTMLInputElement).value).toBe('2026-11-05')
      expect((end.element as HTMLInputElement).value).toBe('2026-12-12')
      expect(wrapper.get('img[alt="Prévia da capa"]').attributes('src')).toBe(project.cover_url)
      expect(saveButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('does not change the cover when saving without touching it', async () => {
      const wrapper = mountForm({ project })

      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('submit')).toEqual([[unchanged]])
    })

    it('asks to remove the cover only after the person removes it', async () => {
      const wrapper = mountForm({ project })

      await wrapper.get('button[aria-label="Remover capa"]').trigger('click')
      await flushPromises()
      expect(wrapper.emitted('change')).toBeTruthy()

      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('submit')).toEqual([[{ ...unchanged, removeCover: true }]])
    })

    it('has nothing to remove when the project has no cover', async () => {
      const wrapper = mountForm({ project: { ...project, cover_url: null } })

      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('submit')).toEqual([[unchanged]])
    })

    it('still applies the rules of the form', async () => {
      const wrapper = mountForm({ project: { ...project, name: 'Iridium' } })

      expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
      expect(wrapper.find('.error').exists()).toBe(false)
    })
  })
})
