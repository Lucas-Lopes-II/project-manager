import { beforeEach, describe, expect, it, vi } from 'vitest'

import { request } from '@/shared/api/client'

import { createProject, type ProjectInput } from './api'

vi.mock('@/shared/api/client', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

const input: ProjectInput = {
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  cover: null,
}

function sentForm(): FormData {
  return requestMock.mock.calls[0]?.[1]?.body as FormData
}

beforeEach(() => {
  requestMock.mockReset()
})

describe('createProject', () => {
  it('sends the fields in a form', async () => {
    await createProject(input)

    expect(requestMock.mock.calls[0]?.[0]).toBe('/projects')
    expect(requestMock.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(Object.fromEntries(sentForm())).toEqual({
      name: 'Projeto Iridium',
      client: 'Clicksign',
      start_date: '2026-11-05',
      end_date: '2026-12-12',
    })
  })

  it('sends the cover in the same request', async () => {
    const cover = new File(['image'], 'capa.png', { type: 'image/png' })

    await createProject({ ...input, cover })

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect((sentForm().get('cover') as File).name).toBe('capa.png')
  })
})
