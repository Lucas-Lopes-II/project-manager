import { describe, expect, it } from 'vitest'

import router from './router'

describe('router', () => {
  it('opens the new project page', async () => {
    await router.push('/projetos/novo')

    expect(router.currentRoute.value.name).toBe('project-new')
  })

  it('opens the edit page with the id of the project', async () => {
    await router.push('/projetos/abc/editar')

    expect(router.currentRoute.value.name).toBe('project-edit')
    expect(router.currentRoute.value.params.id).toBe('abc')
  })

  it('sends unknown paths to the project list', async () => {
    await router.push('/caminho-inexistente')

    expect(router.currentRoute.value.name).toBe('projects')
  })
})
