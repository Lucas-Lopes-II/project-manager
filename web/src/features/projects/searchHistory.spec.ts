import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SEARCH_HISTORY_KEY, useSearchHistoryStore } from './searchHistory'

/** A new store, as after reloading the page. */
function reload() {
  setActivePinia(createPinia())
  return useSearchHistoryStore()
}

function stored(): unknown {
  return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? 'null')
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useSearchHistoryStore', () => {
  it('keeps the last 5 searches, the newest first', () => {
    const history = reload()

    for (const term of ['alfa', 'beta', 'gama', 'delta', 'épsilon', 'zeta']) {
      history.record(term)
    }

    expect(history.terms).toEqual(['zeta', 'épsilon', 'delta', 'gama', 'beta'])
  })

  it('keeps a single entry while the person types or deletes the end of a term', () => {
    const history = reload()
    history.record('alfa')

    for (const term of ['pro', 'proj', 'projeto', 'proje']) {
      history.record(term)
    }

    expect(history.terms).toEqual(['proje', 'alfa'])
  })

  it('compares only with the newest term to replace it', () => {
    const history = reload()
    history.record('projeto')
    history.record('alfa')

    history.record('proj')

    expect(history.terms).toEqual(['proj', 'alfa', 'projeto'])
  })

  it('moves a repeated search to the top, without case and accents, with its new spelling', () => {
    const history = reload()
    history.record('Área Norte')
    history.record('alfa')
    history.record('beta')

    history.record('area norte')

    expect(history.terms).toEqual(['area norte', 'beta', 'alfa'])
  })

  it('ignores short terms and keeps single spaces', () => {
    const history = reload()

    history.record('  pr ')
    history.record('  Projeto    Alfa ')

    expect(history.terms).toEqual(['Projeto Alfa'])
  })

  it('removes a single term', () => {
    const history = reload()
    history.record('alfa')
    history.record('beta')

    history.remove('alfa')

    expect(history.terms).toEqual(['beta'])
    expect(stored()).toEqual(['beta'])
  })

  it('keeps the history after reloading the page', () => {
    reload().record('projeto')

    expect(stored()).toEqual(['projeto'])
    expect(reload().terms).toEqual(['projeto'])
  })

  it('follows the changes made in another tab', () => {
    const history = reload()
    history.record('alfa')

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['beta', 'alfa']))
    window.dispatchEvent(new StorageEvent('storage', { key: SEARCH_HISTORY_KEY }))
    expect(history.terms).toEqual(['beta', 'alfa'])

    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    expect(history.terms).toEqual([])
  })

  it('ignores invalid stored values', () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, '{')
    expect(reload().terms).toEqual([])

    localStorage.setItem(SEARCH_HISTORY_KEY, '{"terms":[]}')
    expect(reload().terms).toEqual([])

    localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((letter) => `${letter}lfa`)),
    )
    expect(reload().terms).toHaveLength(5)

    localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(['alfa', 1, null, 'pr', ' beta  gama ']),
    )
    expect(reload().terms).toEqual(['alfa', 'beta gama'])
  })

  it('works in memory when the storage is not available', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    const history = reload()

    history.record('projeto')
    history.record('alfa')
    history.remove('projeto')

    expect(history.terms).toEqual(['alfa'])
  })
})
