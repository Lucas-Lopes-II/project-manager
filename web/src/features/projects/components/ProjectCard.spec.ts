import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import router from '@/app/router'
import placeholder from '@/shared/assets/project-placeholder.svg'

import type { Project } from '../api'
import ProjectCard from './ProjectCard.vue'

const project: Project = {
  id: '1',
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
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

    const item = wrapper.get('[role="menuitem"]')
    expect(item.text()).toBe('Editar')
    expect(item.attributes('href')).toBe('/projetos/1/editar')
  })
})
