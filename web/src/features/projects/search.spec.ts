import { describe, expect, it } from 'vitest'

import { foldText, highlightParts, searchTerm } from './search'

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

describe('foldText', () => {
  it('ignores case and accents', () => {
    expect(foldText('Área de Ação')).toBe('area de acao')
  })
})

describe('highlightParts', () => {
  const marked = (text: string, term: string) =>
    highlightParts(text, term)
      .map((part) => (part.match ? `[${part.text}]` : part.text))
      .join('')

  it('marks the term with the original characters', () => {
    expect(highlightParts('Projeto 01', 'projet')).toEqual([
      { text: 'Projet', match: true },
      { text: 'o 01', match: false },
    ])
    expect(marked('Área Norte', 'AREA')).toBe('[Área] Norte')
    expect(marked('Ação e reação', 'acao')).toBe('[Ação] e re[ação]')
  })

  it('marks every occurrence, without overlapping', () => {
    expect(marked('Projeto de projetos', 'projeto')).toBe('[Projeto] de [projeto]s')
    expect(marked('aaaa', 'aa')).toBe('[aa][aa]')
  })

  it('compares the term as the search does', () => {
    expect(marked('Projeto Alfa', '  projeto   alfa ')).toBe('[Projeto Alfa]')
    expect(marked('100% pronto', '0%')).toBe('10[0%] pronto')
  })

  it('keeps accents written as separate marks inside the marked part', () => {
    expect(marked('Área', 'area')).toBe('[Área]')
    expect(marked('Café com leite', 'cafe')).toBe('[Café] com leite')
  })

  it('keeps the whole text when nothing matches or there is no term', () => {
    expect(highlightParts('Projeto', 'outro')).toEqual([{ text: 'Projeto', match: false }])
    expect(highlightParts('Projeto', '  ')).toEqual([{ text: 'Projeto', match: false }])
    expect(highlightParts('', 'proj')).toEqual([])
  })
})
