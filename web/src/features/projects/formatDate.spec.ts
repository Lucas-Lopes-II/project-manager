import { describe, expect, it } from 'vitest'

import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('writes the date as in the design', () => {
    expect(formatDate('2024-09-01')).toBe('01 de setembro de 2024')
    expect(formatDate('2024-12-12')).toBe('12 de dezembro de 2024')
  })

  it('keeps the same day in any time zone', () => {
    expect(formatDate('2026-01-01')).toBe('01 de janeiro de 2026')
    expect(formatDate('2026-12-31')).toBe('31 de dezembro de 2026')
  })
})
