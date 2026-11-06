<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { MIN_SEARCH_LENGTH, searchTerm } from '@/features/projects/search'
import { useSearchHistoryStore } from '@/features/projects/searchHistory'

/** The search waits this long after the last key (ADR-0032). */
const SEARCH_DELAY_MS = 300

const route = useRoute()
const router = useRouter()
const searchHistory = useSearchHistoryStore()

const form = useTemplateRef('form')
const input = useTemplateRef('input')
const searchButton = useTemplateRef('searchButton')

const isOpen = ref(false)
const text = ref('')
const hasFocus = ref(false)

const onSearchPage = computed(() => route.name === 'project-search')
const showsBar = computed(() => isOpen.value && !route.meta.hideSearch)

/** The last searches appear under the focused bar while the field is empty (ADR-0033). */
const showsHistory = computed(
  () => showsBar.value && hasFocus.value && text.value === '' && searchHistory.terms.length > 0,
)

let timer: ReturnType<typeof setTimeout> | undefined

// On the result page, the bar stays open with the term of the address.
watch(
  () => (onSearchPage.value ? searchTerm(route.query.q) : undefined),
  (term) => {
    if (term === undefined) return
    isOpen.value = true
    if (searchTerm(text.value) !== term) {
      text.value = term
    }
  },
  { immediate: true },
)

// Leaving the result page, by "Voltar" or by the browser, closes the bar.
watch(
  () => route.name,
  (name, previous) => {
    if (previous === 'project-search' && name !== 'project-search') {
      close()
    }
  },
)

onBeforeUnmount(clearTimer)

function clearTimer(): void {
  clearTimeout(timer)
  timer = undefined
}

async function open(): Promise<void> {
  isOpen.value = true
  await nextTick()
  input.value?.focus()
}

async function close({ restoreFocus = false } = {}): Promise<void> {
  clearTimer()
  isOpen.value = false
  hasFocus.value = false
  text.value = ''
  if (restoreFocus) {
    await nextTick()
    searchButton.value?.focus()
  }
}

/**
 * The first search opens the result page with a new entry in the browser history, and the next
 * terms replace it, so the back button returns to the list in one step.
 */
function search({ force = false } = {}): void {
  clearTimer()
  const q = searchTerm(text.value)

  if (onSearchPage.value) {
    if (q !== searchTerm(route.query.q)) {
      void router.replace({ name: 'project-search', query: { q } })
    }
  } else if (force || q.length >= MIN_SEARCH_LENGTH) {
    void router.push({ name: 'project-search', query: { q } })
  }
}

function onInput(): void {
  clearTimer()
  timer = setTimeout(search, SEARCH_DELAY_MS)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || onSearchPage.value) return

  event.preventDefault()
  if (text.value) {
    clearTimer()
    text.value = ''
  } else {
    void close({ restoreFocus: true })
  }
}

/** On the list, an empty bar closes when the focus goes elsewhere, such as a click outside. */
function onFocusout(event: FocusEvent): void {
  if (form.value?.contains(event.relatedTarget as Node | null)) return
  hasFocus.value = false
  if (!onSearchPage.value && !text.value) {
    void close()
  }
}

/** The focus moves to the field before the list closes, so it is not lost with the button. */
function choose(term: string): void {
  input.value?.focus()
  text.value = term
  search({ force: true })
}

/**
 * When the focus is in the removed item, as after the keyboard, it moves to the next term, or to
 * the previous one at the end of the list, before the item leaves the page. A click keeps it where
 * it was.
 */
function removeTerm(term: string, index: number): void {
  const items = form.value?.querySelectorAll('.history-item') ?? []
  if (items[index]?.contains(document.activeElement)) {
    const next = items[index + 1] ?? items[index - 1]
    const target = next?.querySelector<HTMLButtonElement>('.history-term') ?? input.value
    target?.focus()
  }
  searchHistory.remove(term)
}
</script>

<template>
  <header class="header" :class="{ searching: showsBar }">
    <form
      v-if="showsBar"
      ref="form"
      class="search-bar"
      :class="{ 'with-history': showsHistory }"
      role="search"
      @submit.prevent="search({ force: true })"
      @keydown="onKeydown"
      @focusin="hasFocus = true"
      @focusout="onFocusout"
    >
      <img src="@/shared/assets/icons/search-primary.svg" alt="" width="20" height="20" />
      <input
        ref="input"
        v-model="text"
        class="search-input"
        type="search"
        placeholder="Digite o nome do projeto..."
        aria-label="Buscar projetos pelo nome"
        autocomplete="off"
        enterkeyhint="search"
        @input="onInput"
      />

      <!-- A click keeps the focus in the field, so the bar does not close before the choice. -->
      <ul v-if="showsHistory" class="history" aria-label="Buscas recentes" @mousedown.prevent>
        <li v-for="(term, index) in searchHistory.terms" :key="term" class="history-item">
          <button class="history-term" type="button" @click="choose(term)">
            <img src="@/shared/assets/icons/history.svg" alt="" width="16" height="16" />
            <span class="history-text">{{ term }}</span>
          </button>
          <button
            class="history-remove"
            type="button"
            :aria-label="`Remover ${term} do histórico`"
            @click="removeTerm(term, index)"
          >
            <img src="@/shared/assets/icons/close.svg" alt="" width="16" height="16" />
          </button>
        </li>
      </ul>
    </form>

    <template v-else>
      <RouterLink class="logo" :to="{ name: 'projects' }">
        <img src="@/shared/assets/logo.svg" alt="Gerenciador de Projetos" width="193" height="72" />
      </RouterLink>
      <button
        v-if="!route.meta.hideSearch"
        ref="searchButton"
        class="search"
        type="button"
        aria-label="Buscar projetos"
        @click="open"
      >
        <img src="@/shared/assets/icons/search.svg" alt="" width="20" height="20" />
      </button>
    </template>
  </header>
</template>

<style scoped>
.header {
  /* Where the magnifier of the bar starts, and the icons of the history below it. */
  --search-inset: 31px;

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: var(--topbar-height);
  background: var(--color-topbar);
  box-shadow: var(--shadow-raised);

  :focus-visible {
    outline-color: var(--color-surface);
  }
}

.logo {
  grid-column: 2;
}

.search {
  display: grid;
  place-items: center;
  justify-self: end;
  width: 40px;
  height: 40px;
  margin-right: 53px;
  padding: 0;
  border: 0;
  background: none;
}

/* On phones, the icons follow the 16 px margins of the page (ADR-0036). */
@media (width < 600px) {
  .header {
    --search-inset: 15px;
  }

  .search {
    margin-right: 6px;
  }
}

/* The bar takes the whole header, as in the design. */
.searching {
  display: flex;
  background: var(--color-surface);
}

.search-bar {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  gap: 23px;
  height: 100%;
  padding: 0 calc(var(--search-inset) + 1px) 0 var(--search-inset);
  border-bottom: 2px solid transparent;

  /* The field takes the whole bar, so its focus is shown on the bar itself. */
  &:focus-within {
    border-bottom-color: var(--color-primary);
  }

  /* With the history, the bar and the list form a single outlined box, as in the design. */
  &.with-history {
    border-bottom-color: transparent;
    box-shadow:
      inset 0 2px var(--color-primary),
      inset 2px 0 var(--color-primary),
      inset -2px 0 var(--color-primary);
  }
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--color-text);
  font-size: var(--font-size-lg);
  line-height: 24px;

  &::placeholder {
    color: var(--color-text-muted);
  }

  &::-webkit-search-cancel-button {
    appearance: none;
  }
}
.history {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 2;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--color-primary);
  border-top: 0;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  list-style: none;

  :focus-visible {
    outline-color: var(--color-primary);
    outline-offset: -2px;
  }
}

.history-item {
  display: flex;
  align-items: center;
  height: 52px;
  border-top: 1px solid var(--color-page);

  &:hover {
    background: var(--color-page);
  }
}

/* The icon sits under the magnifier and the term starts where the typed text does. */
.history-term {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 25px;
  min-width: 0;
  height: 100%;
  padding: 0 0 0 var(--search-inset);
  border: 0;
  background: none;
  color: var(--color-text-muted);
  line-height: 16px;
  text-align: left;
}

.history-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The icon ends 24 px before the edge, as in the design. */
.history-remove {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-right: 10px;
  padding: 0;
  border: 0;
  background: none;
}
</style>
