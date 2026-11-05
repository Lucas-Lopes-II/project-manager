import { describe, expect, it } from 'vitest'

import router from './router'

describe('router', () => {
  it('opens the new project page', async () => {
    await router.push('/projetos/novo')

    expect(router.currentRoute.value.name).toBe('project-new')
  })

  it('sends unknown paths to the project list', async () => {
    await router.push('/caminho-inexistente')

    expect(router.currentRoute.value.name).toBe('projects')
  })
})
