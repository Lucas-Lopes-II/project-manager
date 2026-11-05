<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'

import moreIcon from '@/shared/assets/icons/more.svg'

defineProps<{
  /** Names the button and the menu for assistive technology. */
  label: string
}>()

const root = useTemplateRef('root')
const toggleButton = useTemplateRef('toggleButton')
const menu = useTemplateRef('menu')

const menuId = useId()
const isOpen = ref(false)

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('pointerdown', onPointerDown)
  } else {
    document.removeEventListener('pointerdown', onPointerDown)
  }
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

function items(): HTMLElement[] {
  return Array.from(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

async function open(): Promise<void> {
  isOpen.value = true
  await nextTick()
  items()[0]?.focus()
}

function close(): void {
  isOpen.value = false
}

function toggle(): void {
  if (isOpen.value) {
    close()
  } else {
    void open()
  }
}

/** As in a menu button, the focus returns to the button after an option is chosen. */
function onChoose(): void {
  close()
  toggleButton.value?.focus()
}

function onPointerDown(event: PointerEvent): void {
  if (!root.value?.contains(event.target as Node)) {
    close()
  }
}

function focusItem(step: number): void {
  const all = items()
  const current = all.indexOf(document.activeElement as HTMLElement)
  all[(current + step + all.length) % all.length]?.focus()
}

function onKeydown(event: KeyboardEvent): void {
  if (!isOpen.value) {
    return
  }

  switch (event.key) {
    case 'Escape':
      close()
      toggleButton.value?.focus()
      break
    case 'Tab':
      close()
      return
    case 'ArrowDown':
      focusItem(1)
      break
    case 'ArrowUp':
      focusItem(-1)
      break
    case 'Home':
      items()[0]?.focus()
      break
    case 'End':
      items().slice(-1)[0]?.focus()
      break
    case ' ':
      ;(document.activeElement as HTMLElement | null)?.click()
      break
    default:
      return
  }
  event.preventDefault()
}
</script>

<template>
  <div ref="root" class="action-menu" @keydown="onKeydown">
    <button
      ref="toggleButton"
      class="toggle"
      type="button"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? menuId : undefined"
      @click="toggle"
    >
      <img :src="moreIcon" alt="" width="16" height="4" />
    </button>

    <div
      v-if="isOpen"
      :id="menuId"
      ref="menu"
      class="menu"
      role="menu"
      :aria-label="label"
      @click="onChoose"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.action-menu {
  position: relative;
}

.toggle {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
}

.menu {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  z-index: 1;
  width: 240px;
  border-radius: var(--radius-control);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);

  /* The tip that points to the button. */
  &::before {
    content: '';
    position: absolute;
    top: -7px;
    right: 7px;
    width: 16px;
    height: 12px;
    background: var(--color-surface);
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
}
</style>
