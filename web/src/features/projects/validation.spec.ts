import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/api/client'

import type { ProjectInput } from './api'
import {
  coverProblem,
  errorsFromApi,
  hasErrors,
  MAX_COVER_BYTES,
  validateProject,
} from './validation'

const valid: ProjectInput = {
  name: 'Projeto Iridium',
  client: 'Clicksign',
  start_date: '2026-11-05',
  end_date: '2026-12-12',
  cover: null,
}

const DATE_MESSAGE = 'Selecione uma data válida'

describe('validateProject', () => {
  it('accepts valid values', () => {
    expect(hasErrors(validateProject(valid))).toBe(false)
  })

  it.each([
    ['empty', ''],
    ['one word', 'Iridium'],
    ['only spaces', '   '],
    ['a symbol as the second word', 'Iridium -'],
  ])('requires two words in the name: %s', (_, name) => {
    expect(validateProject({ ...valid, name })).toEqual({
      name: 'Por favor, digite ao menos duas palavras',
    })
  })

  it('accepts accents and numbers as words', () => {
    expect(hasErrors(validateProject({ ...valid, name: 'Área 51' }))).toBe(false)
  })

  it('requires a word in the client', () => {
    expect(validateProject({ ...valid, client: ' - ' })).toEqual({
      client: 'Por favor, digite ao menos uma palavra',
    })
  })

  it('limits the text to 120 characters, ignoring extra spaces', () => {
    const limit = `a ${'b'.repeat(118)}`

    expect(hasErrors(validateProject({ ...valid, name: `  ${limit}    ` }))).toBe(false)
    expect(validateProject({ ...valid, name: `${limit}b` })).toEqual({
      name: 'Use no máximo 120 caracteres',
    })
    expect(validateProject({ ...valid, client: 'c'.repeat(121) })).toEqual({
      client: 'Use no máximo 120 caracteres',
    })
  })

  it('requires both dates', () => {
    expect(validateProject({ ...valid, start_date: '', end_date: '' })).toEqual({
      start_date: DATE_MESSAGE,
      end_date: DATE_MESSAGE,
    })
    expect(validateProject({ ...valid, end_date: '' })).toEqual({ end_date: DATE_MESSAGE })
  })

  it.each([
    ['equal', '2026-11-05'],
    ['earlier', '2026-11-04'],
  ])('marks both dates when the end is %s', (_, end_date) => {
    expect(validateProject({ ...valid, end_date })).toEqual({
      start_date: DATE_MESSAGE,
      end_date: DATE_MESSAGE,
    })
  })

  it('accepts dates in the past', () => {
    const past = { ...valid, start_date: '2000-01-01', end_date: '2000-01-02' }

    expect(hasErrors(validateProject(past))).toBe(false)
  })
})

describe('coverProblem', () => {
  it.each(['image/jpeg', 'image/png'])('accepts %s', (type) => {
    expect(coverProblem(new File(['image'], 'capa', { type }))).toBeUndefined()
  })

  it.each(['image/gif', 'image/svg+xml', 'application/pdf', ''])(
    'refuses the type "%s"',
    (type) => {
      expect(coverProblem(new File(['image'], 'capa', { type }))).toBe('invalid_image')
    },
  )

  it('accepts the size limit and refuses anything above it', () => {
    const file = (size: number) =>
      new File([new Uint8Array(size)], 'capa.png', { type: 'image/png' })

    expect(coverProblem(file(MAX_COVER_BYTES))).toBeUndefined()
    expect(coverProblem(file(MAX_COVER_BYTES + 1))).toBe('max_size')
  })
})

describe('errorsFromApi', () => {
  it('turns the codes of the API into the messages of the fields', () => {
    const error = new ApiError(422, 'Inválido', [
      { field: 'name', code: 'min_words' },
      { field: 'client', code: 'max_length' },
      { field: 'start_date', code: 'invalid_date_range' },
      { field: 'end_date', code: 'invalid_date' },
      { field: 'cover', code: 'invalid_image' },
    ])

    expect(errorsFromApi(error)).toEqual({
      name: 'Por favor, digite ao menos duas palavras',
      client: 'Use no máximo 120 caracteres',
      start_date: DATE_MESSAGE,
      end_date: DATE_MESSAGE,
      cover: 'Escolha uma imagem .jpg ou .png',
    })
  })

  it('points a body above the limit to the cover', () => {
    expect(errorsFromApi(new ApiError(413, 'Muito grande'))).toEqual({
      cover: 'A imagem deve ter até 5 MB',
    })
  })

  it('has nothing to show for other errors', () => {
    expect(errorsFromApi(new ApiError(500, 'Erro'))).toEqual({})
    expect(errorsFromApi(new ApiError(422, 'Erro', [{ field: 'name', code: 'other' }]))).toEqual({})
  })
})
