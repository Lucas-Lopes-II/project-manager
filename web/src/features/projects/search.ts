/** The search runs from this many characters on (ADR-0032). */
export const MIN_SEARCH_LENGTH = 3

/** The term of an address, trimmed and with single spaces, as the API compares it. */
export function searchTerm(value: unknown): string {
  return typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean).join(' ') : ''
}

/** Compares texts as the search does, without case and accents (ADR-0032). */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
}

export interface TextPart {
  text: string
  match: boolean
}

/**
 * Splits a text into the parts that contain the term and the others, keeping the original
 * characters, so that "area" marks "Área" (ADR-0034).
 */
export function highlightParts(text: string, term: string): TextPart[] {
  const needle = foldText(searchTerm(term))
  if (!needle) return text ? [{ text, match: false }] : []

  // Each character is folded alone, so every folded position points back to the original text.
  let folded = ''
  const origin: number[] = []
  let position = 0
  for (const char of text) {
    const foldedChar = foldText(char)
    folded += foldedChar
    origin.push(...Array.from(foldedChar, () => position))
    position += char.length
  }
  origin.push(text.length)

  const parts: TextPart[] = []
  let done = 0
  let at = folded.indexOf(needle)
  while (at !== -1) {
    const start = origin[at]!
    const end = origin[at + needle.length]!
    if (end > start) {
      if (start > done) parts.push({ text: text.slice(done, start), match: false })
      parts.push({ text: text.slice(start, end), match: true })
      done = end
    }
    at = folded.indexOf(needle, at + needle.length)
  }
  if (done < text.length) parts.push({ text: text.slice(done), match: false })
  return parts
}
