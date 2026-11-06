import { describe, expect, it } from 'vitest'

import { searchTerm } from './search'

describe('searchTerm', () => {
  it('trims the term and keeps single spaces, as the API compares it', () => {
    expect(searchTerm('  projeto   alfa ')).toBe('projeto alfa')
  })

  it('ignores what is not a single term', () => {
    expect(searchTerm(undefined)).toBe('')
    expect(searchTerm(['a', 'b'])).toBe('')
    expect(searchTerm('   ')).toBe('')
  })
})
