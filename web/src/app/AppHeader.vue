<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { MIN_SEARCH_LENGTH, searchTerm } from '@/features/projects/search'

/** The search waits this long after the last key (ADR-0032). */
const SEARCH_DELAY_MS = 300

const route = useRoute()
const router = useRouter()

const form = useTemplateRef('form')
const input = useTemplateRef('input')
const searchButton = useTemplateRef('searchButton')

const isOpen = ref(false)
const text = ref('')

const onSearchPage = computed(() => route.name === 'project-search')
const showsBar = computed(() => isOpen.value && !route.meta.hideSearch)

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
  text.value = ''
  if (restoreFocus) {
    await nextTick()
    searchButton.value?.focus()
  }
}

/**
 * The first search opens the result page with a new entry in the history, and the next terms
 * replace it, so the back button returns to the list in one step.
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
  if (onSearchPage.value || text.value) return
  if (!form.value?.contains(event.relatedTarget as Node | null)) {
    void close()
  }
}
</script>

<template>
  <header class="header" :class="{ searching: showsBar }">
    <form
      v-if="showsBar"
      ref="form"
      class="search-bar"
      role="search"
      @submit.prevent="search({ force: true })"
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
        @keydown="onKeydown"
      />
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

/* The bar takes the whole header, as in the design. */
.searching {
  display: flex;
  background: var(--color-surface);
}

.search-bar {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 23px;
  height: 100%;
  padding: 0 32px 0 31px;
  border-bottom: 2px solid transparent;

  /* The field takes the whole bar, so its focus is shown on the bar itself. */
  &:focus-within {
    border-bottom-color: var(--color-primary);
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
</style>
