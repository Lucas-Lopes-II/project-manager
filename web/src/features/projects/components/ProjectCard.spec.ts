import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import router from '@/app/router'
import starFilledIcon from '@/shared/assets/icons/star-filled.svg'
import starOutlineIcon from '@/shared/assets/icons/star-outline.svg'
import placeholder from '@/shared/assets/project-placeholder.svg'

import type { Project } from '../api'
import ProjectCard from './ProjectCard.vue'

const project: Project = {
  id: '1',
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
  favorite: false,
  cover_url: null,
  created_at: '2024-09-01T12:00:00Z',
  updated_at: '2024-09-01T12:00:00Z',
}

function mountCard(card: Project = project) {
  return mount(ProjectCard, { props: { project: card }, global: { plugins: [router] } })
}

describe('ProjectCard', () => {
  it('shows the data of the project, with the dates as in the design', () => {
    const wrapper = mountCard()

    expect(wrapper.get('h2').text()).toBe('Projeto Iridium')
    expect(wrapper.text()).toContain('Cliente: Clicksign')

    const dates = wrapper.findAll('time')
    expect(dates.map((date) => date.text())).toEqual([
      '01 de setembro de 2024',
      '12 de dezembro de 2024',
    ])
    expect(dates.map((date) => date.attributes('datetime'))).toEqual(['2024-09-01', '2024-12-12'])
  })

  it('shows the full text of long values on hover', () => {
    const wrapper = mountCard()

    expect(wrapper.get('h2').attributes('title')).toBe('Projeto Iridium')
    expect(wrapper.get('.client').attributes('title')).toBe('Clicksign')
  })

  it('shows the cover and leaves its loading for when it gets close to the screen', () => {
    const wrapper = mountCard({ ...project, cover_url: '/api/v1/projects/1/cover?v=1' })
    const cover = wrapper.get('.cover')

    expect(cover.attributes('src')).toBe('/api/v1/projects/1/cover?v=1')
    expect(cover.attributes('loading')).toBe('lazy')
  })

  it('shows the placeholder when there is no cover', () => {
    const wrapper = mountCard()

    expect(wrapper.get('.cover').attributes('src')).toBe(placeholder)
  })

  it('offers the edition of the project in its menu', async () => {
    const wrapper = mountCard()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    const toggle = wrapper.get('button[aria-haspopup="menu"]')
    expect(toggle.attributes('aria-label')).toBe('Ações do projeto Projeto Iridium')

    await toggle.trigger('click')
    await flushPromises()

    const [edit, remove] = wrapper.findAll('[role="menuitem"]')
    expect(edit!.text()).toBe('Editar')
    expect(edit!.attributes('href')).toBe('/projetos/1/editar')
    expect(remove!.text()).toBe('Remover')
    expect(remove!.element.tagName).toBe('BUTTON')
    expect(remove!.attributes('type')).toBe('button')
  })

  it('asks the page to remove the project', async () => {
    const wrapper = mountCard()

    await wrapper.get('button[aria-haspopup="menu"]').trigger('click')
    await flushPromises()
    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')

    expect(wrapper.emitted('remove')).toEqual([[project]])
  })

  it('shows the star of the design and its state', () => {
    const normal = mountCard().get('button[aria-pressed]')
    const favorite = mountCard({ ...project, favorite: true }).get('button[aria-pressed]')

    expect(normal.attributes('aria-label')).toBe('Favoritar Projeto Iridium')
    expect(normal.attributes('aria-pressed')).toBe('false')
    expect(normal.get('img').attributes('src')).toBe(starOutlineIcon)
    expect(favorite.attributes('aria-pressed')).toBe('true')
    expect(favorite.get('img').attributes('src')).toBe(starFilledIcon)
  })

  it('asks the page to change the favorite', async () => {
    const wrapper = mountCard()

    await wrapper.get('button[aria-pressed]').trigger('click')

    expect(wrapper.emitted('toggleFavorite')).toEqual([[project]])
  })
})
