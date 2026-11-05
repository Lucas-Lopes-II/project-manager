<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'

import trashIcon from '@/shared/assets/icons/trash-white.svg'
import BaseButton from '@/shared/ui/BaseButton.vue'

import type { Project } from '../api'
import { useProjectsStore } from '../store'

const REMOVE_FAILURE = 'Não foi possível remover o projeto. Tente novamente.'

/** The dialog is open while there is a project to remove. */
const props = defineProps<{ project: Project | null }>()

const emit = defineEmits<{
  cancel: []
  removed: []
}>()

const projects = useProjectsStore()

const dialog = useTemplateRef('dialog')
const confirmButton = useTemplateRef<InstanceType<typeof BaseButton>>('confirmButton')
const removing = ref(false)
const failure = ref<string>()

watch(
  () => props.project,
  (project) => {
    if (project) {
      failure.value = undefined
      dialog.value?.showModal()
    } else {
      dialog.value?.close()
    }
  },
  { flush: 'post' },
)

async function confirm(): Promise<void> {
  if (!props.project || removing.value) {
    return
  }

  removing.value = true
  failure.value = undefined
  try {
    await projects.remove(props.project.id)
    emit('removed')
  } catch {
    failure.value = REMOVE_FAILURE
    removing.value = false
    // The disabled button lost the focus, so it gets it back to try again.
    await nextTick()
    confirmButton.value?.$el.focus()
    return
  }
  removing.value = false
}

/** Esc, a click outside and "Cancelar" all cancel, except while removing. */
function cancel(): void {
  if (!removing.value) {
    emit('cancel')
  }
}

function onCancel(event: Event): void {
  event.preventDefault()
  cancel()
}

/** The browser can also close the dialog by itself, and the page must know it. */
function onClose(): void {
  if (props.project) {
    emit('cancel')
  }
}

function onClick(event: MouseEvent): void {
  // The backdrop belongs to the dialog itself, while the content is inside it.
  if (event.target === dialog.value) {
    cancel()
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    aria-labelledby="remove-project-title"
    @cancel="onCancel"
    @close="onClose"
    @click="onClick"
  >
    <div class="content">
      <div class="icon">
        <img :src="trashIcon" alt="" width="20" height="20" />
      </div>
      <h2 id="remove-project-title" class="title">Remover projeto</h2>

      <p class="text">Essa ação removerá definitivamente o projeto:</p>
      <p class="name">{{ project?.name }}</p>

      <p v-if="failure" class="failure" role="alert">{{ failure }}</p>

      <div class="actions">
        <BaseButton class="cancel" variant="outline" :disabled="removing" @click="cancel">
          Cancelar
        </BaseButton>
        <BaseButton ref="confirmButton" class="confirm" :disabled="removing" @click="confirm">
          Confirmar
        </BaseButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(582px, 100% - 32px);
  max-width: none;
  /* The same proportion of the screen as in the design, which starts at 292 px of 1080 px. */
  margin: max(27dvh, 48px) auto auto;
  padding: 0;
  overflow: visible;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  color: var(--color-text);

  &::backdrop {
    background: var(--color-backdrop);
    backdrop-filter: blur(10px);
  }
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 32px 32px;
  text-align: center;
}

.icon {
  display: grid;
  place-items: center;
  position: absolute;
  top: -32px;
  left: calc(50% - 32px);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: var(--shadow-raised);
}

.title {
  align-self: stretch;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-divider-strong);
  color: var(--color-heading);
  font-size: var(--font-size-dialog-title);
  font-weight: var(--font-weight-semibold);
  line-height: 32px;
}

.text {
  margin-top: 33px;
  color: var(--color-text-muted);
  line-height: 22px;
}

.name {
  max-width: 100%;
  margin-top: 13px;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-medium);
  line-height: 32px;
  overflow-wrap: anywhere;
}

.failure {
  margin-top: 16px;
  color: var(--color-error);
  line-height: 22px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  align-self: stretch;
  margin-top: 32px;
}

/* More specific than the sizes of the button: the widths keep the proportion of the design,
   and on narrow screens the buttons go to separate lines instead of squeezing the text. */
.actions > .cancel,
.actions > .confirm {
  min-width: max-content;
  padding-inline: 16px;
}

.actions > .cancel {
  flex: 1 1 calc((100% - 32px) * 226 / 486);
}

.actions > .confirm {
  flex: 1 1 calc((100% - 32px) * 260 / 486);
}
</style>
