import { describe, expect, it } from 'vitest'

import router, { APP_NAME } from './router'

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

  it('gives each page its title in the browser tab', async () => {
    const titles = {
      '/': `Projetos · ${APP_NAME}`,
      '/busca?q=projeto': `Resultado da busca · ${APP_NAME}`,
      '/projetos/novo': `Novo projeto · ${APP_NAME}`,
      '/projetos/abc/editar': `Editar projeto · ${APP_NAME}`,
    }

    for (const [path, title] of Object.entries(titles)) {
      await router.push(path)
      expect(document.title).toBe(title)
    }
  })

  it('sends unknown paths to the project list', async () => {
    await router.push('/caminho-inexistente')

    expect(router.currentRoute.value.name).toBe('projects')
  })
})
