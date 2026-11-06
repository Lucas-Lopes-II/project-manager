/** The search runs from this many characters on (ADR-0032). */
export const MIN_SEARCH_LENGTH = 3

/** The term of an address, trimmed and with single spaces, as the API compares it. */
export function searchTerm(value: unknown): string {
  return typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean).join(' ') : ''
}
