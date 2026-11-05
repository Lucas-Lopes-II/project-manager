import type { ApiError } from '@/shared/api/client'

import type { ProjectInput } from './api'

export type ProjectField = 'name' | 'client' | 'start_date' | 'end_date' | 'cover'
export type ProjectErrors = Partial<Record<ProjectField, string>>
export type CoverProblem = 'invalid_image' | 'max_size'

export const MAX_COVER_BYTES = 5 * 1024 * 1024

const MAX_TEXT_LENGTH = 120
const MIN_WORDS = { name: 2, client: 1 }
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const COVER_TYPES = ['image/jpeg', 'image/png']

const MIN_WORDS_MESSAGES = {
  name: 'Por favor, digite ao menos duas palavras',
  client: 'Por favor, digite ao menos uma palavra',
}
const MAX_LENGTH_MESSAGE = 'Use no máximo 120 caracteres'
const INVALID_DATE_MESSAGE = 'Selecione uma data válida'
const COVER_MESSAGES: Record<CoverProblem, string> = {
  invalid_image: 'Escolha uma imagem .jpg ou .png',
  max_size: 'A imagem deve ter até 5 MB',
}

/** Repeats the rules of the API (ADR-0012) to give immediate feedback. The API has the final say. */
export function validateProject(values: ProjectInput): ProjectErrors {
  const errors: ProjectErrors = {
    name: validateText('name', values.name),
    client: validateText('client', values.client),
  }

  const validStart = DATE_PATTERN.test(values.start_date)
  const validEnd = DATE_PATTERN.test(values.end_date)
  const validRange = !validStart || !validEnd || values.end_date > values.start_date

  if (!validStart || !validRange) {
    errors.start_date = INVALID_DATE_MESSAGE
  }
  if (!validEnd || !validRange) {
    errors.end_date = INVALID_DATE_MESSAGE
  }

  return withoutEmptyEntries(errors)
}

export function hasErrors(errors: ProjectErrors): boolean {
  return Object.keys(errors).length > 0
}

export function coverProblem(file: File): CoverProblem | undefined {
  if (!COVER_TYPES.includes(file.type)) {
    return 'invalid_image'
  }
  return file.size > MAX_COVER_BYTES ? 'max_size' : undefined
}

export function coverMessage(problem: CoverProblem): string {
  return COVER_MESSAGES[problem]
}

/** Turns an error from the API into the messages of the fields it points to. */
export function errorsFromApi(error: ApiError): ProjectErrors {
  if (error.status === 413) {
    return { cover: COVER_MESSAGES.max_size }
  }

  const errors: ProjectErrors = {}
  for (const { field, code } of error.fieldErrors) {
    const message = messageFor(field, code)
    if (message) {
      errors[field as ProjectField] = message
    }
  }
  return errors
}

function messageFor(field: string, code: string): string | undefined {
  switch (code) {
    case 'min_words':
      return MIN_WORDS_MESSAGES[field as keyof typeof MIN_WORDS_MESSAGES]
    case 'max_length':
      return MAX_LENGTH_MESSAGE
    case 'invalid_date':
    case 'invalid_date_range':
      return INVALID_DATE_MESSAGE
    case 'invalid_image':
    case 'max_size':
      return COVER_MESSAGES[code]
    default:
      return undefined
  }
}

function validateText(field: keyof typeof MIN_WORDS, text: string): string | undefined {
  const parts = text.trim().split(/\s+/)

  if (parts.filter((part) => /[\p{L}\p{N}]/u.test(part)).length < MIN_WORDS[field]) {
    return MIN_WORDS_MESSAGES[field]
  }
  return [...parts.join(' ')].length > MAX_TEXT_LENGTH ? MAX_LENGTH_MESSAGE : undefined
}

function withoutEmptyEntries(errors: ProjectErrors): ProjectErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}
