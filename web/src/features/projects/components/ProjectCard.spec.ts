import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

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

describe('ProjectCard', () => {
  it('shows the data of the project, with the dates as in the design', () => {
    const wrapper = mount(ProjectCard, { props: { project } })

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
    const wrapper = mount(ProjectCard, { props: { project } })

    expect(wrapper.get('h2').attributes('title')).toBe('Projeto Iridium')
    expect(wrapper.get('.client').attributes('title')).toBe('Clicksign')
  })

  it('shows the cover and leaves its loading for when it gets close to the screen', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: { ...project, cover_url: '/api/v1/projects/1/cover?v=1' } },
    })
    const cover = wrapper.get('.cover')

    expect(cover.attributes('src')).toBe('/api/v1/projects/1/cover?v=1')
    expect(cover.attributes('loading')).toBe('lazy')
  })

  it('shows the placeholder when there is no cover', () => {
    const wrapper = mount(ProjectCard, { props: { project } })

    expect(wrapper.get('.cover').attributes('src')).toBe(placeholder)
  })
})
