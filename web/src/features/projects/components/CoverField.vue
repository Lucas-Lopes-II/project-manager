<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

import uploadIcon from '@/shared/assets/icons/upload.svg'
import trashIcon from '@/shared/assets/icons/trash.svg'
import BaseButton from '@/shared/ui/BaseButton.vue'
import FormField from '@/shared/ui/FormField.vue'

import { coverMessage, coverProblem, type CoverProblem } from '../validation'

const model = defineModel<File | null>({ required: true })

/** Address of the cover already saved, shown until it is removed. */
const currentUrl = defineModel<string | null>('currentUrl', { default: null })

const props = defineProps<{ error?: string }>()

const input = useTemplateRef('input')
const selectButton = useTemplateRef<InstanceType<typeof BaseButton>>('selectButton')

const fileUrl = ref<string>()
const rejection = ref<CoverProblem>()

const previewUrl = computed(() => fileUrl.value ?? currentUrl.value)

const message = computed(
  () => props.error ?? (rejection.value ? coverMessage(rejection.value) : undefined),
)

watch(
  model,
  (file) => {
    releasePreview()
    fileUrl.value = file ? URL.createObjectURL(file) : undefined
  },
  { immediate: true },
)

onBeforeUnmount(releasePreview)

function releasePreview(): void {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
  }
}

function onChoose(): void {
  const file = input.value?.files?.[0]
  if (!file) {
    return
  }

  // Clearing the input lets the same file be chosen again.
  input.value.value = ''

  const problem = coverProblem(file)
  rejection.value = problem
  model.value = problem ? null : file
}

/** A chosen file that the browser cannot show is not an image, whatever its extension says. */
function onPreviewError(): void {
  if (model.value) {
    rejection.value = 'invalid_image'
    model.value = null
  }
}

async function remove(): Promise<void> {
  rejection.value = undefined
  model.value = null
  currentUrl.value = null

  // The button that had the focus is gone, so the focus goes to the one that replaces it.
  await nextTick()
  selectButton.value?.$el.focus()
}
</script>

<template>
  <FormField v-slot="{ id, describedBy }" label="Capa do projeto" :error="message">
    <input
      :id="id"
      ref="input"
      class="visually-hidden"
      type="file"
      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
      tabindex="-1"
      :aria-describedby="describedBy"
      @change="onChoose"
    />

    <div v-if="previewUrl" class="preview">
      <img class="image" :src="previewUrl" alt="Prévia da capa" @error="onPreviewError" />
      <button class="remove" type="button" aria-label="Remover capa" @click="remove">
        <img :src="trashIcon" alt="" width="20" height="20" />
      </button>
    </div>

    <div v-else class="picker" :class="{ invalid: message }">
      <img :src="uploadIcon" alt="" width="24" height="24" />
      <p class="hint">Escolha uma imagem .jpg ou .png no seu dispositivo</p>
      <BaseButton
        ref="selectButton"
        size="small"
        variant="outline"
        aria-label="Selecionar capa do projeto"
        @click="input?.click()"
      >
        Selecionar
      </BaseButton>
    </div>
  </FormField>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 23px 16px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-field);
  text-align: center;

  &.invalid {
    border-color: var(--color-error);
  }
}

.hint {
  margin-block: 16px 24px;
  color: var(--color-text-muted);
  line-height: 22px;
}

.preview {
  position: relative;
}

.image {
  width: 100%;
  aspect-ratio: 702 / 395;
  border-radius: var(--radius-control);
  object-fit: cover;
}

.remove {
  display: grid;
  place-items: center;
  position: absolute;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
}
</style>
