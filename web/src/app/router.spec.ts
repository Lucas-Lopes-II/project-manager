import { describe, expect, it } from 'vitest'

import router from './router'

describe('router', () => {
  it('sends unknown paths to the project list', async () => {
    await router.push('/caminho-inexistente')

    expect(router.currentRoute.value.name).toBe('projects')
  })
})
