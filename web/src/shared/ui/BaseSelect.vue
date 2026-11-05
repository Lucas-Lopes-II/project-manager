<script setup lang="ts" generic="T extends string">
import { computed, ref, useId } from 'vue'

/**
 * A select-only combobox, as in the WAI-ARIA pattern (ADR-0030). The focus stays on the
 * combobox, and the active option is announced through aria-activedescendant.
 */
const model = defineModel<T>({ required: true })

const props = defineProps<{
  options: { value: T; label: string }[]
  /** Names the control for assistive technology, since the design has no visible label. */
  label: string
}>()

const id = useId()
const listId = `${id}-list`

const isOpen = ref(false)
const active = ref(0)

const selectedIndex = computed(() =>
  Math.max(
    0,
    props.options.findIndex((option) => option.value === model.value),
  ),
)

const TYPE_AHEAD_MS = 500
let typed = ''
let typedAt = 0

function optionId(index: number): string {
  return `${id}-option-${index}`
}

function open(index = selectedIndex.value): void {
  isOpen.value = true
  active.value = index
}

function close(): void {
  isOpen.value = false
}

function choose(index: number): void {
  const option = props.options[index]
  if (option) {
    model.value = option.value
  }
  close()
}

function toggle(): void {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

/** Typing goes to the first option that starts with the typed letters, ignoring accents. */
function typeAhead(key: string): void {
  const now = Date.now()
  typed = now - typedAt > TYPE_AHEAD_MS ? key : typed + key
  typedAt = now

  const search = normalize(typed)
  const index = props.options.findIndex((option) => normalize(option.label).startsWith(search))
  if (index >= 0) {
    open(index)
  }
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
}

function isPrintable(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey
  )
}

function onKeydown(event: KeyboardEvent): void {
  const last = props.options.length - 1

  if (!isOpen.value) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        open()
        break
      case 'Home':
        open(0)
        break
      case 'End':
        open(last)
        break
      default:
        if (!isPrintable(event)) return
        typeAhead(event.key)
    }
    event.preventDefault()
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      active.value = Math.min(active.value + 1, last)
      break
    case 'ArrowUp':
      if (event.altKey) {
        choose(active.value)
      } else {
        active.value = Math.max(active.value - 1, 0)
      }
      break
    case 'Home':
      active.value = 0
      break
    case 'End':
      active.value = last
      break
    case 'Enter':
    case ' ':
      choose(active.value)
      break
    case 'Escape':
      close()
      break
    case 'Tab':
      // The value is chosen and the focus moves on, as in the pattern.
      choose(active.value)
      return
    default:
      if (!isPrintable(event)) return
      typeAhead(event.key)
  }
  event.preventDefault()
}
</script>

<template>
  <div class="select" :class="{ open: isOpen }">
    <div
      class="combobox"
      role="combobox"
      tabindex="0"
      aria-haspopup="listbox"
      :aria-label="label"
      :aria-expanded="isOpen"
      :aria-controls="listId"
      :aria-activedescendant="isOpen ? optionId(active) : undefined"
      @click="toggle"
      @keydown="onKeydown"
      @blur="close"
    >
      <span class="value">{{ options[selectedIndex]?.label }}</span>
      <span class="chevron" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M0.75 3.75 8 11.25l7.25-7.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <ul v-show="isOpen" :id="listId" class="listbox" role="listbox" :aria-label="label">
      <!-- Pressing an option keeps the focus on the combobox, so it does not close by blur. -->
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option.value"
        class="option"
        :class="{ active: index === active }"
        role="option"
        :aria-selected="option.value === model"
        @mousedown.prevent
        @mouseenter="active = index"
        @click="choose(index)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* A fixed width, so the toolbar measures it correctly; it only shrinks on narrow screens. */
.select {
  position: relative;
  width: 296px;
  max-width: 100%;
}

.combobox {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 3px 0 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  line-height: 18px;
  cursor: pointer;
}

.value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  color: var(--color-text-muted);
  transition: transform 150ms;
}

.open {
  .combobox {
    border-color: var(--color-primary);
    border-radius: var(--radius-control) var(--radius-control) 0 0;
  }

  .chevron {
    color: var(--color-primary);
    transform: rotate(180deg);
  }
}

.listbox {
  position: absolute;
  top: calc(100% - 1px);
  right: 0;
  left: 0;
  z-index: 1;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-primary);
  border-radius: 0 0 var(--radius-card) var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  list-style: none;
}

/* With the divider, the next options are 1 px taller, as in the design. */
.option {
  display: flex;
  align-items: center;
  height: 53px;
  padding-inline: 15px;
  color: var(--color-text);
  line-height: 16px;
  cursor: pointer;

  & + & {
    height: 54px;
    border-top: 1px solid var(--color-divider);
  }
}

.active {
  background: var(--color-page);
}

@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>
