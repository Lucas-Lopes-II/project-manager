import { defineStore } from 'pinia'
import { ref } from 'vue'

import { MIN_SEARCH_LENGTH, searchTerm } from './search'

/** The history keeps this many terms, the newest first (ADR-0033). */
export const MAX_SEARCH_HISTORY = 5

export const SEARCH_HISTORY_KEY = 'project-manager:search-history'

/** Compares terms as the search does, without case and accents. */
function fold(term: string): string {
  return term.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
}

function isTerm(value: unknown): value is string {
  return typeof value === 'string' && searchTerm(value).length >= MIN_SEARCH_LENGTH
}

/** Without access to the storage, the history lasts while the page is open. */
function readStorage(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.filter(isTerm).map(searchTerm).slice(0, MAX_SEARCH_HISTORY)
      : []
  } catch {
    return []
  }
}

function writeStorage(terms: string[]): void {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(terms))
  } catch {
    // The history in memory still works.
  }
}

export const useSearchHistoryStore = defineStore('searchHistory', () => {
  const terms = ref<string[]>(readStorage())

  // Another tab changed the history, so this one follows it instead of overwriting it later.
  window.addEventListener('storage', (event) => {
    if (event.key === SEARCH_HISTORY_KEY || event.key === null) {
      terms.value = readStorage()
    }
  })

  /**
   * Puts a search on top. The search runs while the person types, so a term replaces the newest
   * one when one starts with the other, and "pro", "proj" and "projeto" become a single entry.
   */
  function record(value: string): void {
    const term = searchTerm(value)
    if (term.length < MIN_SEARCH_LENGTH) return

    const key = fold(term)
    const [newest, ...rest] = terms.value
    const older =
      newest !== undefined && (key.startsWith(fold(newest)) || fold(newest).startsWith(key))
        ? rest
        : terms.value

    terms.value = [term, ...older.filter((item) => fold(item) !== key)].slice(0, MAX_SEARCH_HISTORY)
    writeStorage(terms.value)
  }

  function remove(term: string): void {
    terms.value = terms.value.filter((item) => item !== term)
    writeStorage(terms.value)
  }

  return { terms, record, remove }
})
