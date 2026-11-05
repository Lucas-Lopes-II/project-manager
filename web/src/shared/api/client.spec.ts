import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, isAbortError, request } from './client'

const fetchMock = vi.fn<typeof fetch>()

function rejection(promise: Promise<unknown>): Promise<ApiError> {
  return promise.then(
    () => {
      throw new Error('expected the request to fail')
    },
    (error: ApiError) => error,
  )
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('request', () => {
  it('returns the JSON body of a successful response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { total: 1 }))

    await expect(request('/projects')).resolves.toEqual({ total: 1 })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/projects',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('lets the browser set the Content-Type of a form', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, {}))
    const form = new FormData()

    await request('/projects', { method: 'POST', body: form })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/projects',
      expect.objectContaining({ method: 'POST', body: form, headers: undefined }),
    )
  })

  it('sends the body as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, {}))

    await request('/projects', { method: 'POST', body: { name: 'Projeto Iridium' } })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/projects',
      expect.objectContaining({
        method: 'POST',
        body: '{"name":"Projeto Iridium"}',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('returns nothing for a 204 response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(request('/projects/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('converts a problem response into an ApiError with the invalid fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        title: 'Unprocessable Entity',
        detail: 'Um ou mais campos são inválidos.',
        request_id: 'abc',
        errors: [{ field: 'name', code: 'min_words' }],
      }),
    )

    const error = await rejection(request('/projects', { method: 'POST', body: {} }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.message).toBe('Um ou mais campos são inválidos.')
    expect(error.requestId).toBe('abc')
    expect(error.fieldErrors).toEqual([{ field: 'name', code: 'min_words' }])
  })

  it('handles an error response without a JSON body', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' }),
    )

    const error = await rejection(request('/projects'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
    expect(error.message).toBe('Bad Gateway')
    expect(error.fieldErrors).toEqual([])
  })

  it('converts a network failure into an ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await rejection(request('/projects'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
  })

  it('keeps the AbortError of a canceled request', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementation((_, init) => {
      init?.signal?.throwIfAborted()
      return Promise.resolve(jsonResponse(200, {}))
    })
    controller.abort()

    const error = await rejection(request('/projects', { signal: controller.signal }))

    expect(isAbortError(error)).toBe(true)
  })
})
