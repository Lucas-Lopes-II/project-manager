<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import calendarCheckIcon from '@/shared/assets/icons/calendar-check.svg'
import calendarDayIcon from '@/shared/assets/icons/calendar-day.svg'
import BaseButton from '@/shared/ui/BaseButton.vue'
import DateField from '@/shared/ui/DateField.vue'
import TextField from '@/shared/ui/TextField.vue'

import type { ProjectInput } from '../api'
import { hasErrors, validateProject, type ProjectErrors, type ProjectField } from '../validation'
import CoverField from './CoverField.vue'

const props = defineProps<{
  saving?: boolean
  /** Errors from the last attempt, which the parent clears when the form changes. */
  serverErrors?: ProjectErrors
  failure?: string
}>()

const emit = defineEmits<{
  submit: [values: ProjectInput]
  change: []
}>()

const values = reactive<ProjectInput>({
  name: '',
  client: '',
  start_date: '',
  end_date: '',
  cover: null,
})

const touched = reactive<Partial<Record<ProjectField, boolean>>>({})

const errors = computed(() => validateProject(values))

const canSave = computed(
  () => !props.saving && !hasErrors(errors.value) && !hasErrors(props.serverErrors ?? {}),
)

watch(values, () => emit('change'))

/** A field only shows its rule after the person leaves it. */
function errorOf(field: ProjectField): string | undefined {
  return props.serverErrors?.[field] ?? (touched[field] ? errors.value[field] : undefined)
}

function submit(): void {
  if (canSave.value) {
    emit('submit', { ...values })
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <TextField
      v-model="values.name"
      label="Nome do projeto"
      required
      :error="errorOf('name')"
      @blur="touched.name = true"
    />
    <TextField
      v-model="values.client"
      label="Cliente"
      required
      :error="errorOf('client')"
      @blur="touched.client = true"
    />

    <div class="dates">
      <DateField
        v-model="values.start_date"
        label="Data de Início"
        :icon="calendarDayIcon"
        required
        :error="errorOf('start_date')"
        @blur="touched.start_date = true"
      />
      <DateField
        v-model="values.end_date"
        label="Data Final"
        :icon="calendarCheckIcon"
        required
        :error="errorOf('end_date')"
        @blur="touched.end_date = true"
      />
    </div>

    <CoverField v-model="values.cover" :error="serverErrors?.cover" />

    <p v-if="failure" class="failure" role="alert">{{ failure }}</p>

    <BaseButton class="save" type="submit" :disabled="!canSave">Salvar projeto</BaseButton>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: min(704px, 100%);
  margin-inline: auto;
}

.dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 32px 40px;
}

.failure {
  color: var(--color-error);
  line-height: 22px;
  text-align: center;
}

.save {
  width: 100%;
}
</style>
